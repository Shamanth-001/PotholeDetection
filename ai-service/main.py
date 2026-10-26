"""
CivicLens AI — Image Analysis Microservice
FastAPI service that asks an NVIDIA-hosted vision language model whether a photo shows the reported issue
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone
import os
import logging
import requests
import base64
import json
import re

# Config
PORT = int(os.getenv("PORT", "8000"))
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

app = FastAPI(title="CivicLens AI Analysis Service", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Available NVIDIA vision models (all listed at https://integrate.api.nvidia.com/v1/models)
SUPPORTED_MODELS = {
    "llama": "meta/llama-3.2-90b-vision-instruct",
    "llama-small": "meta/llama-3.2-11b-vision-instruct",
    "nemotron": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    "nemotron-super": "nvidia/nemotron-3.5-super-vl-120b-a12b",
}
# Switch with VISION_MODEL=llama|llama-small|nemotron|nemotron-super in .env.
# Nemotron models answer in ~1-3s; the Llama models often take 60s+ on the hosted API, so they are never used as fallback
ACTIVE_MODEL = os.getenv("VISION_MODEL", "nemotron")
FALLBACK_MODEL = "nemotron-super" if ACTIVE_MODEL != "nemotron-super" else "nemotron"
# Step-by-step thinking makes Nemotron slower without changing yes/no answers in testing; set VISION_THINKING=true to enable it
VISION_THINKING = os.getenv("VISION_THINKING", "false").lower() == "true"
REQUEST_TIMEOUT = int(os.getenv("VISION_TIMEOUT", "20"))
if ACTIVE_MODEL not in SUPPORTED_MODELS:
    logger.warning(f"Unknown VISION_MODEL '{ACTIVE_MODEL}', using 'nemotron'")
    ACTIVE_MODEL = "nemotron"

if MOCK_MODE:
    logger.warning("MOCK_MODE is enabled: every image is accepted with a fixed confidence. Do not use in production.")
elif not NVIDIA_API_KEY:
    logger.error("NVIDIA_API_KEY is not set: /analyze will return 503 until it is configured.")

# Response Models
class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_name: str

class AnalysisResponse(BaseModel):
    detected_class: str
    confidence: float
    bounding_boxes: List[BoundingBox]
    timestamp: str
    model_version: str
    image_dimensions: dict

class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    mode: str
    model: str

start_time = datetime.now(timezone.utc)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    uptime = (datetime.now(timezone.utc) - start_time).total_seconds()
    return HealthResponse(
        status="healthy" if (MOCK_MODE or NVIDIA_API_KEY) else "misconfigured",
        uptime_seconds=uptime,
        mode="mock" if MOCK_MODE else "nvidia",
        model=SUPPORTED_MODELS[ACTIVE_MODEL],
    )

def parse_verdict(text):
    """Return (detected, confidence 0-1) from the model's JSON answer, or None if there is no usable JSON."""
    # Non-greedy, so a reasoning trace containing several {...} blocks doesn't merge them
    for block in re.findall(r"\{[^{}]*\}", text, re.DOTALL):
        try:
            parsed = json.loads(block)
        except ValueError:
            continue
        if "detected" not in parsed:
            continue
        detected = parsed["detected"] in (True, "true", "True")
        conf_val = float(parsed.get("confidence", 0) or 0)
        # Normalize confidence to 0.0 - 1.0
        confidence = conf_val / 100.0 if conf_val > 1.0 else conf_val
        return detected, max(0.0, min(confidence, 1.0))
    return None

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    issue_type: str = Form("pothole")
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Upload JPEG or PNG.")

    if MOCK_MODE:
        await file.read()
        return AnalysisResponse(
            detected_class=issue_type,
            confidence=0.8,
            bounding_boxes=[],
            timestamp=datetime.now(timezone.utc).isoformat(),
            model_version="mock",
            image_dimensions={"width": 0, "height": 0},
        )

    if not NVIDIA_API_KEY:
        raise HTTPException(status_code=503, detail="AI service is not configured (NVIDIA_API_KEY missing).")

    try:
        image_bytes = await file.read()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        # 1. Stronger Prompts for Tricky Real-World Conditions
        system_prompt = (
            "You are a senior BBMP road inspector with deep experience detecting infrastructure issues in "
            "difficult real-world conditions in Bengaluru."
        )

        if issue_type.lower() == "pothole":
            user_prompt = (
                "Carefully examine the image for any pothole or significant road damage, including water-filled, "
                "muddy, or partially hidden ones. \n"
                "Respond ONLY with valid JSON:\n"
                "{\n"
                "  \"detected\": true/false,\n"
                "  \"confidence\": 0-100,\n"
                "  \"reasoning\": \"short explanation\"\n"
                "}"
            )
        else:
            user_prompt = (
                "Carefully examine the image for any pile of garbage, solid waste accumulation, or illegal dumping, "
                "including waste hidden near trees, leaves, shadows, or in low light. \n"
                "Respond ONLY with valid JSON:\n"
                "{\n"
                "  \"detected\": true/false,\n"
                "  \"confidence\": 0-100,\n"
                "  \"reasoning\": \"short explanation\"\n"
                "}"
            )

        # Try ACTIVE_MODEL first, then the other fast Nemotron model on failure/timeout (the hosted API returns 503 when busy)
        models_to_try = [ACTIVE_MODEL, FALLBACK_MODEL]

        verdict = None
        used_model_key = ACTIVE_MODEL

        for model_key in models_to_try:
            used_model_key = model_key
            model_name = SUPPORTED_MODELS[model_key]

            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {"type": "image_url", "image_url": {"url": f"data:{file.content_type};base64,{image_b64}"}}
                        ]
                    }
                ],
                "max_tokens": 4096 if VISION_THINKING else 300,
                "temperature": 0.2, # Lower temperature for strictly formatted JSON
                "top_p": 0.95
            }

            # Nemotron thinking switch. These are top-level body fields in a raw HTTP request
            # ("extra_body" only exists in the OpenAI Python SDK)
            if model_key.startswith("nemotron"):
                payload["chat_template_kwargs"] = {"enable_thinking": VISION_THINKING}
                if VISION_THINKING:
                    payload["reasoning_budget"] = 2048

            headers = {
                "Authorization": f"Bearer {NVIDIA_API_KEY}",
                "Accept": "application/json",
                "Content-Type": "application/json"
            }

            try:
                logger.info(f"Sending request to {model_name} for '{issue_type}' (Timeout: {REQUEST_TIMEOUT}s)...")
                response = requests.post(
                    "https://integrate.api.nvidia.com/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=REQUEST_TIMEOUT
                )

                if response.status_code != 200:
                    logger.warning(f"Model {model_name} failed with status {response.status_code}: {response.text[:300]}")
                    raise Exception(f"Vision API error: {response.status_code}")

                message = response.json()["choices"][0]["message"]
                content = message.get("content") or ""
                reasoning = message.get("reasoning_content") or ""

                # 2. The final answer lives in content; only look in the reasoning trace if content has no JSON
                verdict = parse_verdict(content) or parse_verdict(reasoning)
                if verdict is None:
                    raise Exception(f"No usable JSON verdict in response: {content[:200]!r}")

                logger.info(f"Verdict from {model_name}: detected={verdict[0]} confidence={verdict[1]:.2f}")
                break

            except Exception as e:
                logger.error(f"Request failed for model {model_name}: {str(e)}")
                if model_key == models_to_try[-1]:
                    # Out of models to try
                    raise
                logger.info(f"Retrying with fallback model {SUPPORTED_MODELS[FALLBACK_MODEL]}...")

        detected, best_confidence = verdict
        # Ensure confidence is 0 if not detected
        if not detected:
            best_confidence = 0.0

        # The vision LLM gives a yes/no verdict, not object locations
        return AnalysisResponse(
            detected_class=issue_type if detected else "None",
            confidence=round(best_confidence, 3),
            bounding_boxes=[],
            timestamp=datetime.now(timezone.utc).isoformat(),
            model_version=SUPPORTED_MODELS[used_model_key],
            image_dimensions={"width": 0, "height": 0}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
