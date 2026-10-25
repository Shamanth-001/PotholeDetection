"""
CivicLens AI — Image Analysis Microservice
FastAPI service using NVIDIA YOLO-World Open-Vocabulary API
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
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
VISION_MODEL = os.getenv("VISION_MODEL", "meta/llama-3.2-90b-vision-instruct")

app = FastAPI(title="CivicLens AI Analysis Service", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    model_version: str = "nvidia-yolo-world"
    image_dimensions: dict

class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    mode: str

start_time = datetime.now(timezone.utc)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    uptime = (datetime.now(timezone.utc) - start_time).total_seconds()
    return HealthResponse(
        status="healthy" if (MOCK_MODE or NVIDIA_API_KEY) else "misconfigured",
        uptime_seconds=uptime,
        mode="mock" if MOCK_MODE else "nvidia",
    )

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
        
        # Define the prompt based on the issue type
        if issue_type.lower() == "pothole":
            question = "Analyze this image. Does it clearly show a pothole or severe road damage? Reply ONLY with JSON: {\"detected\": true/false, \"confidence\": 0-100}"
        else:
            question = "Analyze this image. Does it clearly show a pile of garbage, litter, or dumped waste? Reply ONLY with JSON: {\"detected\": true/false, \"confidence\": 0-100}"

        payload = {
            "model": VISION_MODEL,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": question},
                    {"type": "image_url", "image_url": {"url": f"data:{file.content_type};base64,{image_b64}"}}
                ]
            }],
            "max_tokens": 100,
            "temperature": 0.1
        }

        headers = {
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

        logger.info(f"Sending request to NVIDIA Vision API for '{issue_type}'...")
        response = requests.post(
            "https://integrate.api.nvidia.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code != 200:
            logger.error(f"NVIDIA API Error {response.status_code}: {response.text}")
            raise Exception(f"Vision API error: {response.status_code}")

        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        try:
            # The model sometimes wraps the JSON in prose or a code fence
            match = re.search(r"\{.*?\}", content, re.DOTALL)
            parsed = json.loads(match.group(0) if match else content)
            detected = bool(parsed.get("detected", False))
            best_confidence = float(parsed.get("confidence", 0)) / 100.0 if detected else 0.0
        except Exception as e:
            logger.error(f"Failed to parse LLM response: {content}")
            # Unparseable answer: don't guess, let a human review it
            detected = issue_type.lower() in content.lower()
            best_confidence = 0.5 if detected else 0.0

        # The vision LLM gives a yes/no verdict, not object locations
        bounding_boxes = []

        return AnalysisResponse(
            detected_class=issue_type if best_confidence > 0 else "None",
            confidence=round(best_confidence, 3),
            bounding_boxes=bounding_boxes,
            timestamp=datetime.now(timezone.utc).isoformat(),
            model_version=VISION_MODEL,
            image_dimensions={"width": 0, "height": 0}  # Not returned by API easily
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
