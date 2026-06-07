"""
WIE Connection Platform — Face Embedding Service
File: wie-face-service/face_service.py

Handles:
  - Face detection in images
  - Embedding extraction using face_recognition (dlib / FaceNet backend)
  - Storing embeddings per user
  - Cosine similarity matching
"""

import face_recognition
import cv2
import numpy as np
from typing import Optional, Tuple
import json
import os

# ── In production replace with PostgreSQL / Redis storage ──
EMBEDDINGS_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "embeddings.json")


def _ensure_db():
    os.makedirs(os.path.dirname(EMBEDDINGS_DB_PATH), exist_ok=True)
    if not os.path.exists(EMBEDDINGS_DB_PATH):
        with open(EMBEDDINGS_DB_PATH, "w") as f:
            json.dump({}, f)


def _load_db() -> dict:
    _ensure_db()
    with open(EMBEDDINGS_DB_PATH, "r") as f:
        return json.load(f)


def _save_db(data: dict):
    _ensure_db()
    with open(EMBEDDINGS_DB_PATH, "w") as f:
        json.dump(data, f)


class FaceService:
    """
    Encapsulates all face embedding operations.
    Uses face_recognition library (dlib 128-d descriptor).
    """

    # Cosine similarity threshold: ≥ 0.65 → same person
    # face_recognition distance:   ≤ 0.45 → same person (distance = 1 - cosine_sim)
    SIMILARITY_THRESHOLD = 0.65
    DISTANCE_THRESHOLD   = 0.45     # face_recognition uses Euclidean distance

    # ──────────────────────────────────────────────────
    # Extract embedding from raw image bytes
    # ──────────────────────────────────────────────────
    def extract_embedding_from_bytes(
        self, image_bytes: bytes
    ) -> Tuple[Optional[np.ndarray], Optional[str]]:
        """
        Decodes bytes → numpy array → extracts 128-d face encoding.
        Returns (embedding, None) on success, (None, error_message) on failure.
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        bgr   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if bgr is None:
            return None, "Could not decode image."

        # face_recognition expects RGB
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

        # Detect face locations first for better accuracy (use cnn model for production)
        face_locations = face_recognition.face_locations(rgb, model="hog")
        if len(face_locations) == 0:
            return None, "No face detected in image."

        if len(face_locations) > 1:
            # Take the largest detected face
            face_locations = [max(face_locations, key=lambda b: (b[2]-b[0]) * (b[1]-b[3]))]

        encodings = face_recognition.face_encodings(rgb, known_face_locations=face_locations)
        if len(encodings) == 0:
            return None, "Face detected but embedding extraction failed."

        return np.array(encodings[0]), None

    # ──────────────────────────────────────────────────
    # Store embeddings for a user
    # ──────────────────────────────────────────────────
    def store_embeddings(self, user_id: str, embeddings: list[list]):
        db = _load_db()
        db[user_id] = embeddings
        _save_db(db)

    def has_embeddings(self, user_id: str) -> bool:
        db = _load_db()
        return user_id in db and len(db[user_id]) > 0

    def get_embeddings(self, user_id: str) -> list[np.ndarray]:
        db = _load_db()
        raw = db.get(user_id, [])
        return [np.array(e) for e in raw]

    # ──────────────────────────────────────────────────
    # Match a live embedding against stored profile embeddings
    # ──────────────────────────────────────────────────
    def match_face(self, user_id: str, live_embedding: np.ndarray) -> dict:
        """
        Compares live_embedding against all stored profile embeddings.
        Uses face_recognition distance + cosine similarity.

        Returns:
            {
              "verified": bool,
              "best_similarity": float,
              "best_distance": float,
              "match_count": int  # how many profile images matched
            }
        """
        stored = self.get_embeddings(user_id)
        if not stored:
            return {"verified": False, "best_similarity": 0.0, "best_distance": 1.0, "match_count": 0}

        distances   = face_recognition.face_distance(stored, live_embedding)
        similarities = [self._cosine_similarity(live_embedding, e) for e in stored]

        best_distance   = float(np.min(distances))
        best_similarity = float(np.max(similarities))

        # A match requires both distance AND similarity to pass
        match_count = int(np.sum(distances <= self.DISTANCE_THRESHOLD))

        verified = (
            best_distance   <= self.DISTANCE_THRESHOLD and
            best_similarity >= self.SIMILARITY_THRESHOLD
        )

        return {
            "verified":        verified,
            "best_similarity": best_similarity,
            "best_distance":   best_distance,
            "match_count":     match_count,
        }

    # ──────────────────────────────────────────────────
    # Cosine similarity helper
    # ──────────────────────────────────────────────────
    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        denom = np.linalg.norm(a) * np.linalg.norm(b)
        if denom == 0:
            return 0.0
        return float(np.dot(a, b) / denom)