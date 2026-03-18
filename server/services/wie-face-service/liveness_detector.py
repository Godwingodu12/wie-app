"""
WIE Connection Platform — Liveness / Head Pose Detector
File: wie-face-service/liveness_detector.py

Uses MediaPipe FaceMesh to estimate head orientation from a single frame.
Returns one of: center | left | right | up | down | no_face
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Tuple, Optional


class LivenessDetector:
    """
    Detects head pose direction from image bytes using MediaPipe FaceMesh.

    Landmark indices used:
      1   — nose tip
      33  — left eye outer corner  (viewer's right)
      263 — right eye outer corner (viewer's left)
      10  — forehead top
      152 — chin bottom
    """

    # ── Threshold tuning ──────────────────────────────────────────
    # Increase these if pose changes are detected too eagerly,
    # decrease if the user has to rotate further than expected.
    HORIZONTAL_THRESHOLD = 0.035   # nose X offset from eye midpoint
    VERTICAL_THRESHOLD   = 0.03    # nose Y offset from face vertical midpoint

    def __init__(self):
        self._mp_face_mesh = mp.solutions.face_mesh
        self._face_mesh    = self._mp_face_mesh.FaceMesh(
            static_image_mode=True,       # single-frame mode
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        )

    # ──────────────────────────────────────────────────────────────
    # Public: detect pose from raw image bytes
    # ──────────────────────────────────────────────────────────────
    def detect_head_pose_from_bytes(
        self, image_bytes: bytes
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Returns (pose_label, None) on success, (None, error) on failure.
        pose_label: "center" | "left" | "right" | "up" | "down" | "no_face"
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        bgr   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if bgr is None:
            return None, "Could not decode frame."

        rgb    = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        pose   = self._estimate_pose(rgb)
        return pose, None

    # ──────────────────────────────────────────────────────────────
    # Public: detect pose from a numpy RGB frame (for local use)
    # ──────────────────────────────────────────────────────────────
    def detect_head_pose_from_frame(self, rgb_frame: np.ndarray) -> str:
        return self._estimate_pose(rgb_frame)

    # ──────────────────────────────────────────────────────────────
    # Core estimation logic
    # ──────────────────────────────────────────────────────────────
    def _estimate_pose(self, rgb: np.ndarray) -> str:
        results = self._face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return "no_face"

        lm = results.multi_face_landmarks[0].landmark

        nose      = lm[1]
        left_eye  = lm[33]    # viewer's right (person's left)
        right_eye = lm[263]   # viewer's left  (person's right)
        forehead  = lm[10]
        chin      = lm[152]

        # Horizontal: midpoint between eyes
        eye_mid_x = (left_eye.x + right_eye.x) / 2
        h_offset  = nose.x - eye_mid_x

        # Vertical: midpoint between forehead and chin
        face_mid_y = (forehead.y + chin.y) / 2
        v_offset   = nose.y - face_mid_y

        # ── Classify pose ─────────────────────────────────────────
        # Priority: vertical first (up/down), then horizontal (left/right)
        if v_offset < -self.VERTICAL_THRESHOLD:
            return "up"
        if v_offset > self.VERTICAL_THRESHOLD:
            return "down"
        if h_offset < -self.HORIZONTAL_THRESHOLD:
            return "left"
        if h_offset > self.HORIZONTAL_THRESHOLD:
            return "right"

        return "center"

    # ──────────────────────────────────────────────────────────────
    # Utility: draw landmarks on frame (for debug / local testing)
    # ──────────────────────────────────────────────────────────────
    def draw_debug_overlay(self, bgr_frame: np.ndarray, pose: str) -> np.ndarray:
        frame = bgr_frame.copy()

        rgb     = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self._face_mesh.process(rgb)
        h, w    = frame.shape[:2]

        if results.multi_face_landmarks:
            lm   = results.multi_face_landmarks[0].landmark
            pts  = [(int(p.x * w), int(p.y * h)) for p in lm]

            # Draw key points
            for idx in [1, 33, 263, 10, 152]:
                cv2.circle(frame, pts[idx], 4, (0, 255, 0), -1)

        color_map = {
            "center": (0, 255, 0),
            "left":   (255, 165, 0),
            "right":  (255, 165, 0),
            "up":     (0, 200, 255),
            "down":   (0, 200, 255),
            "no_face":(0, 0, 255),
        }
        color = color_map.get(pose, (255, 255, 255))
        cv2.putText(frame, f"Pose: {pose.upper()}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.1, color, 2)
        return frame