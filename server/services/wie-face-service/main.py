"""
WIE Connection Platform — Python Face Verification Service
File: wie-face-service/main.py
Run: uvicorn main:app --host 0.0.0.0 --port 8002 --reload
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from image_validator import validate_image_bytes
from face_service import FaceService
from liveness_detector import LivenessDetector
from session_store import SessionStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WIE Face Verification Service", version="2.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Restrict to your Node.js origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

face_service    = FaceService()
liveness_detect = LivenessDetector()
session_store   = SessionStore()


# ──────────────────────────────────────────────────────────────
# ROUTE 1: Register face embeddings from profile images
# Called by Node.js when user uploads profile photos
# ──────────────────────────────────────────────────────────────
@app.post("/register-face")
async def register_face(
    user_id: str = Form(...),
    images: list[UploadFile] = File(...)
):
    """
    Accepts 2–8 profile images.
    Extracts face embeddings and stores them against user_id.
    """
    if len(images) < 2:
        raise HTTPException(status_code=400, detail="Minimum 2 profile images required.")

    embeddings = []
    for idx, img_file in enumerate(images):
        contents = await img_file.read()
        embedding, error = face_service.extract_embedding_from_bytes(contents)
        if error:
            raise HTTPException(
                status_code=422,
                detail=f"Image {idx + 1}: {error}"
            )
        embeddings.append(embedding.tolist())

    face_service.store_embeddings(user_id, embeddings)
    logger.info(f"[REGISTER] user_id={user_id}, embeddings_count={len(embeddings)}")

    return JSONResponse({
        "status": "success",
        "user_id": user_id,
        "embeddings_stored": len(embeddings),
        "message": "Face embeddings registered successfully."
    })

# ──────────────────────────────────────────────────────────────────
# ROUTE: POST /validate-photo
# Called by Node.js BEFORE uploading to Cloudinary.
# Returns pass/fail + rejection reason for a single image.
# ──────────────────────────────────────────────────────────────────
 
# Paste the block below into main.py:
 

@app.post("/validate-photo")
async def validate_photo(photo: UploadFile = File(...)):
    contents = await photo.read()
    result   = validate_image_bytes(contents)
 
    logger.info(f"[VALIDATE PHOTO] passed={result.passed}, code={result.code}")
 
    return JSONResponse({
        "passed":  result.passed,
        "code":    result.code,
        "message": result.message,
    })
    
# ──────────────────────────────────────────────────────────────
# ROUTE 2: Start verification session → returns session_id + sequence
# ──────────────────────────────────────────────────────────────
@app.post("/start-verification")
async def start_verification(user_id: str = Form(...)):
    """
    Creates a liveness session with a unique challenge sequence.
    Returns session_id and the expected head-rotation sequence.
    """
    if not face_service.has_embeddings(user_id):
        raise HTTPException(status_code=404, detail="No registered face for this user.")

    session_id, sequence = session_store.create_session(user_id)
    logger.info(f"[SESSION START] user_id={user_id}, session_id={session_id}, sequence={sequence}")

    return JSONResponse({
        "status": "success",
        "session_id": session_id,
        "challenge_sequence": sequence,   # e.g. ["center","left","right","up","down","center"]
        "expires_in_seconds": 120
    })


# ──────────────────────────────────────────────────────────────
# ROUTE 3: Submit a single video frame for liveness tracking
# Called every ~500 ms from the frontend camera stream
# ──────────────────────────────────────────────────────────────
@app.post("/submit-frame")
async def submit_frame(
    session_id: str = Form(...),
    frame: UploadFile = File(...)
):
    """
    Receives one frame.
    Detects head pose → advances liveness challenge if pose matches.
    Returns current progress.
    """
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    contents = await frame.read()
    pose, error = liveness_detect.detect_head_pose_from_bytes(contents)

    if error:
        return JSONResponse({"status": "error", "message": error})

    progress = session_store.advance_session(session_id, pose)

    response = {
        "status": "ok",
        "detected_pose": pose,
        "current_step": progress["current_step"],
        "total_steps": progress["total_steps"],
        "completed_steps": progress["completed_steps"],
        "liveness_complete": progress["liveness_complete"],
    }

    # Attach best frame when liveness is done
    if progress["liveness_complete"]:
        session_store.store_best_frame(session_id, contents)
        response["message"] = "Liveness check passed. Ready for face match."

    return JSONResponse(response)


# ──────────────────────────────────────────────────────────────
# ROUTE 4: Final face match — compares best captured frame vs stored embeddings
# ──────────────────────────────────────────────────────────────
@app.post("/verify-face")
async def verify_face(session_id: str = Form(...)):
    """
    Takes the best captured frame from the liveness session.
    Compares it against stored profile embeddings.
    Returns verification result.
    """
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    if not session.get("liveness_complete"):
        raise HTTPException(status_code=400, detail="Liveness check not yet complete.")

    best_frame_bytes = session_store.get_best_frame(session_id)
    if not best_frame_bytes:
        raise HTTPException(status_code=400, detail="No captured frame available.")

    # Extract embedding from captured frame
    live_embedding, error = face_service.extract_embedding_from_bytes(best_frame_bytes)
    if error:
        return JSONResponse({
            "status": "failed",
            "verified": False,
            "liveness": True,
            "message": f"Face extraction from live frame failed: {error}"
        })

    # Compare against stored profile embeddings
    user_id     = session["user_id"]
    result      = face_service.match_face(user_id, live_embedding)

    session_store.close_session(session_id)

    logger.info(
        f"[VERIFY] user_id={user_id}, "
        f"similarity={result['best_similarity']:.3f}, "
        f"verified={result['verified']}"
    )

    return JSONResponse({
        "status": "success" if result["verified"] else "failed",
        "verified": result["verified"],
        "liveness": True,
        "similarity": round(result["best_similarity"], 4),
        "threshold": face_service.SIMILARITY_THRESHOLD,
        "message": "Identity verified." if result["verified"] else "Face does not match profile."
    })

# ROUTE: POST /check-photo
# Called by Node.js upload controller for every new photo after
# initial verification is complete.
@app.post("/check-photo")
async def check_photo(
    user_id: str = Form(...),
    photo: UploadFile = File(...)
):
    if not face_service.has_embeddings(user_id):
        raise HTTPException(
            status_code=404,
            detail="No registered face embeddings for this user. Complete verification first."
        )
 
    contents = await photo.read()
    live_embedding, error = face_service.extract_embedding_from_bytes(contents)
 
    if error:
        return JSONResponse({
            "matched":    False,
            "similarity": 0.0,
            "error":      error
        })
 
    result = face_service.match_face(user_id, live_embedding)
 
    logger.info(
        f"[CHECK PHOTO] user_id={user_id}, "
        f"similarity={result['best_similarity']:.3f}, "
        f"matched={result['verified']}"
    )
 
    return JSONResponse({
        "matched":    result["verified"],
        "similarity": round(result["best_similarity"], 4),
        "threshold":  face_service.SIMILARITY_THRESHOLD,
        "message":    "Photo matches verified identity." if result["verified"]
                      else "Photo does not match verified identity."
    })
# ROUTE 5: Health check
@app.get("/health")
def health():
    return {"status": "running", "service": "WIE Face Verification v2.1"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8002, reload=True)  # ← was 0.0.0.0