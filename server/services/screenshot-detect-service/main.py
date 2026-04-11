"""
Screenshot Detection Service
FastAPI + ML classifier + Redis pub/sub for real-time alerts
"""

import os
import json
import asyncio
import logging
from datetime import datetime

import joblib
import httpx
import redis.asyncio as aioredis
from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from feature_extractor import extract_features

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("screenshot-detect-service")

# Config
PORT             = int(os.getenv("PORT", 8003))
REDIS_URL        = os.getenv("REDIS_URL", "redis://localhost:6379")
MEDIA_SERVICE    = os.getenv("MEDIA_SERVICE_URL", "http://localhost:5010")
MODEL_PATH       = os.getenv("ML_MODEL_PATH", "./models/screenshot_classifier.joblib")
INTERNAL_SECRET  = os.getenv("INTERNAL_SECRET", "wie-internal-secret-2024")

# Load ML model
try:
    model = joblib.load(MODEL_PATH)
    log.info("✅ ML model loaded from %s", MODEL_PATH)
except FileNotFoundError:
    log.error("❌ Model not found at %s — run train_model.py first", MODEL_PATH)
    model = None

# ── Redis
redis_client: aioredis.Redis = None  # type: ignore

app = FastAPI(title="Screenshot Detection Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    global redis_client
    redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
    log.info("✅ Redis connected")


@app.on_event("shutdown")
async def shutdown():
    if redis_client:
        await redis_client.aclose()


# ── Schemas
class ScreenshotEventPayload(BaseModel):
    fluxId:    str
    viewerId:  str
    ownerId:   str
    platform:  str = "web"   # web | ios | android
    confidence: float = 1.0


class ClassifyResponse(BaseModel):
    is_screenshot: bool
    confidence:    float
    label:         str        # "screenshot" | "photo"


# ── Routes

@app.get("/health")
async def health():
    return {
        "status":       "ok",
        "service":      "screenshot-detect-service",
        "model_loaded": model is not None,
        "timestamp":    datetime.utcnow().isoformat(),
    }


@app.post("/classify", response_model=ClassifyResponse)
async def classify_image(
    file: UploadFile = File(...),
    x_internal_secret: str = Header(None),
):
    """
    Classify whether an uploaded image is a screenshot.
    Called by the media service when it receives a canvas capture.
    """
    if x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded")

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image")

    try:
        features      = extract_features(image_bytes)
        prediction    = int(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]
        confidence    = float(probabilities[prediction])

        is_screenshot = prediction == 1
        label         = "screenshot" if is_screenshot else "photo"

        log.info("classify → %s (confidence=%.2f)", label, confidence)
        return ClassifyResponse(
            is_screenshot=is_screenshot,
            confidence=confidence,
            label=label,
        )
    except Exception as e:
        log.error("classify error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/report-event")
async def report_event(
    payload: ScreenshotEventPayload,
    x_internal_secret: str = Header(None),
):
    """
    Called by media service when a screenshot event is confirmed.
    Publishes to Redis so real-time notification service can push to owner.
    """
    if x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    event = {
        "type":       "flux_screenshot",
        "fluxId":     payload.fluxId,
        "viewerId":   payload.viewerId,
        "ownerId":    payload.ownerId,
        "platform":   payload.platform,
        "confidence": payload.confidence,
        "timestamp":  datetime.utcnow().isoformat(),
    }

    # Publish to Redis channel for real-time notification
    channel = f"flux:screenshot:{payload.ownerId}"
    await redis_client.publish(channel, json.dumps(event))

    # Also store in sorted set for analytics (score = timestamp)
    key = f"flux:{payload.fluxId}:screenshot_events"
    await redis_client.zadd(
        key,
        {f"{payload.viewerId}:{datetime.utcnow().timestamp()}": datetime.utcnow().timestamp()},
    )
    await redis_client.expire(key, 7 * 24 * 60 * 60)  # 7 days TTL

    log.info(
        "screenshot event recorded fluxId=%s viewerId=%s platform=%s",
        payload.fluxId, payload.viewerId, payload.platform,
    )
    return {"success": True, "channel": channel}


@app.get("/analytics/{flux_id}")
async def get_screenshot_analytics(
    flux_id: str,
    x_internal_secret: str = Header(None),
):
    """Return aggregated screenshot stats for a flux."""
    if x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    key    = f"flux:{flux_id}:screenshot_events"
    events = await redis_client.zrange(key, 0, -1, withscores=True)

    unique_viewers = set()
    for member, _ in events:
        viewer_id = member.split(":")[0]
        unique_viewers.add(viewer_id)

    return {
        "fluxId":        flux_id,
        "totalEvents":   len(events),
        "uniqueViewers": len(unique_viewers),
        "viewerIds":     list(unique_viewers),
    }

# ── Entry point 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)