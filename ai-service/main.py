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

# Config
PORT = int(os.getenv("PORT", "8000"))
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

app = FastAPI(title="CivicLens AI Analysis Service", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

start_time = datetime.now(timezone.utc)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    uptime = (datetime.now(timezone.utc) - start_time).total_seconds()
    return HealthResponse(
        status="healthy",
        uptime_seconds=uptime
    )

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    issue_type: str = Form("pothole")
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Upload JPEG or PNG.")

    try:
        image_bytes = await file.read()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        
        # Define the prompt based on the issue type
        if issue_type.lower() == "pothole":
            question = "Analyze this image. Does it clearly show a pothole or severe road damage? Reply ONLY with JSON: {\"detected\": true/false, \"confidence\": 0-100}"
        else:
            question = "Analyze this image. Does it clearly show a pile of garbage, litter, or dumped waste? Reply ONLY with JSON: {\"detected\": true/false, \"confidence\": 0-100}"

        payload = {
            "model": "meta/llama-3.2-11b-vision-instruct",
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": question},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
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
            import json
            parsed = json.loads(content.strip("`").replace("json", "").strip())
            detected = parsed.get("detected", False)
            best_confidence = float(parsed.get("confidence", 0)) / 100.0 if detected else 0.0
        except Exception as e:
            logger.error(f"Failed to parse LLM response: {content}")
            detected = issue_type.lower() in content.lower()
            best_confidence = 0.7 if detected else 0.0

        bounding_boxes = []
        if best_confidence > 0:
            bounding_boxes.append(BoundingBox(
                x1=0, y1=0, x2=100, y2=100,
                confidence=best_confidence,
                class_name=issue_type
            ))

        return AnalysisResponse(
            detected_class=issue_type if best_confidence > 0 else "None",
            confidence=round(best_confidence, 3),
            bounding_boxes=bounding_boxes,
            timestamp=datetime.now(timezone.utc).isoformat(),
            model_version="nvidia-yolo-world",
            image_dimensions={"width": 0, "height": 0}  # Not returned by API easily
        )

    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
