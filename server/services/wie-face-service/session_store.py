"""
WIE Connection Platform — In-Memory Session Store
File: wie-face-service/session_store.py

Manages per-user liveness challenge sessions.
Replace with Redis in production for multi-process / multi-instance deployments.
"""

import uuid
import time
import random
from typing import Optional, Tuple


# ── Challenge sequences ────────────────────────────────────────────
# All sequences start and end at "center" to anchor the verification.
CHALLENGE_SEQUENCES = [
    ["center", "left",  "right", "up",   "down",  "center"],
    ["center", "right", "left",  "down", "up",    "center"],
    ["center", "up",    "down",  "left", "right", "center"],
    ["center", "left",  "up",    "right","down",  "center"],
    ["center", "down",  "right", "up",   "left",  "center"],
]

SESSION_TTL_SECONDS = 120   # Session expires after 2 minutes


class SessionStore:
    def __init__(self):
        # { session_id: session_dict }
        self._sessions: dict = {}

    # ──────────────────────────────────────────────────
    # Create a new liveness session
    # ──────────────────────────────────────────────────
    def create_session(self, user_id: str) -> Tuple[str, list]:
        session_id = str(uuid.uuid4())
        sequence   = random.choice(CHALLENGE_SEQUENCES)

        self._sessions[session_id] = {
            "session_id":       session_id,
            "user_id":          user_id,
            "sequence":         sequence,
            "current_step":     0,
            "completed_steps":  [],
            "liveness_complete":False,
            "best_frame":       None,
            "created_at":       time.time(),
            "closed":           False,
        }

        return session_id, sequence

    # ──────────────────────────────────────────────────
    # Retrieve a session (returns None if expired)
    # ──────────────────────────────────────────────────
    def get_session(self, session_id: str) -> Optional[dict]:
        s = self._sessions.get(session_id)
        if not s:
            return None
        if s["closed"]:
            return None
        if time.time() - s["created_at"] > SESSION_TTL_SECONDS:
            del self._sessions[session_id]
            return None
        return s

    # ──────────────────────────────────────────────────
    # Advance the session based on detected pose
    # ──────────────────────────────────────────────────
    def advance_session(self, session_id: str, detected_pose: str) -> dict:
        s = self._sessions.get(session_id)
        if not s or s["liveness_complete"]:
            return self._progress_snapshot(s)

        seq          = s["sequence"]
        current_step = s["current_step"]
        expected     = seq[current_step] if current_step < len(seq) else None

        if detected_pose == expected:
            s["completed_steps"].append(detected_pose)
            s["current_step"] += 1

            # All steps completed → liveness passed
            if s["current_step"] >= len(seq):
                s["liveness_complete"] = True

        return self._progress_snapshot(s)

    # ──────────────────────────────────────────────────
    # Store the best frame bytes for face matching
    # ──────────────────────────────────────────────────
    def store_best_frame(self, session_id: str, frame_bytes: bytes):
        s = self._sessions.get(session_id)
        if s:
            s["best_frame"] = frame_bytes

    def get_best_frame(self, session_id: str) -> Optional[bytes]:
        s = self._sessions.get(session_id)
        return s["best_frame"] if s else None

    # ──────────────────────────────────────────────────
    # Close / invalidate a session after verification
    # ──────────────────────────────────────────────────
    def close_session(self, session_id: str):
        s = self._sessions.get(session_id)
        if s:
            s["closed"] = True

    # ──────────────────────────────────────────────────
    # Helper: build a progress dict from session state
    # ──────────────────────────────────────────────────
    @staticmethod
    def _progress_snapshot(s: Optional[dict]) -> dict:
        if not s:
            return {}
        return {
            "current_step":     s["current_step"],
            "total_steps":      len(s["sequence"]),
            "completed_steps":  s["completed_steps"],
            "liveness_complete":s["liveness_complete"],
            "next_expected":    s["sequence"][s["current_step"]]
                                    if s["current_step"] < len(s["sequence"])
                                    else None,
        }