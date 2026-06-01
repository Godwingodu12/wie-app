"""
WIE Connection Platform — Face Service
Handles face embedding extraction, storage, and matching.
"""
import os
import json
import numpy as np
import face_recognition
import cv2
from typing import Optional, Tuple


class FaceService:

    SIMILARITY_THRESHOLD = 0.55   # cosine similarity — lower = stricter

    def __init__(self):
        # In-memory store: { user_id: [embedding, ...] }
        # Replace with Redis or DB persistence for production
        self._store: dict[str, list[list[float]]] = {}
        self._load_from_disk()

    # ── Persistence (flat JSON file — swap for DB in prod) ────────
    STORE_PATH = "embeddings_store.json"

    def _load_from_disk(self):
        if os.path.exists(self.STORE_PATH):
            try:
                with open(self.STORE_PATH, "r") as f:
                    self._store = json.load(f)
            except Exception:
                self._store = {}

    def _save_to_disk(self):
        try:
            with open(self.STORE_PATH, "w") as f:
                json.dump(self._store, f)
        except Exception as e:
            print(f"[FaceService] Failed to save embeddings: {e}")

    # ── Extract 128-d embedding from raw image bytes ──────────────
    def extract_embedding_from_bytes(
        self, image_bytes: bytes
    ) -> Tuple[Optional[np.ndarray], Optional[str]]:
        """
        Decode bytes → BGR → RGB, find exactly one face, return embedding.
        Returns (embedding, None) on success or (None, error_message) on failure.
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        bgr   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if bgr is None:
            return None, "Could not decode image."

        rgb       = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        locations = face_recognition.face_locations(rgb, model="hog")

        if len(locations) == 0:
            return None, "No face detected in image."
        if len(locations) > 1:
            return None, "Multiple faces detected. Please use a solo photo."

        encodings = face_recognition.face_encodings(rgb, known_face_locations=locations)

        if not encodings:
            return None, "Could not extract face embedding."

        return np.array(encodings[0]), None

    # ── Store embeddings for a user ───────────────────────────────
    def store_embeddings(self, user_id: str, embeddings: list[list[float]]):
        self._store[user_id] = embeddings
        self._save_to_disk()

    # ── Check if user has registered embeddings ───────────────────
    def has_embeddings(self, user_id: str) -> bool:
        return user_id in self._store and len(self._store[user_id]) > 0

    # ── Compare live embedding against stored profile embeddings ──
    def match_face(self, user_id: str, live_embedding: np.ndarray) -> dict:
        """
        Compare live_embedding against all stored embeddings for user_id.
        Returns { verified: bool, best_similarity: float }
        """
        if not self.has_embeddings(user_id):
            return {"verified": False, "best_similarity": 0.0}

        stored = self._store[user_id]
        best   = 0.0

        for emb in stored:
            stored_vec = np.array(emb)
            # Cosine similarity
            denom = (np.linalg.norm(live_embedding) * np.linalg.norm(stored_vec))
            if denom == 0:
                continue
            similarity = float(np.dot(live_embedding, stored_vec) / denom)
            if similarity > best:
                best = similarity

        return {
            "verified":        best >= self.SIMILARITY_THRESHOLD,
            "best_similarity": best,
        }
