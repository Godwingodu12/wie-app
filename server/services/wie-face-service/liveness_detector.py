"""
WIE Connection Platform — Liveness / Head Pose Detector
File: wie-face-service/liveness_detector.py

Note: MediaPipe dependency removed in favor of face_recognition landmarks 
to ensure compatibility across Python versions.
"""

import cv2
import numpy as np
import face_recognition
from typing import Tuple, Optional


class LivenessDetector:
    """
    Detects head pose direction from image bytes using face_recognition landmarks.
    """

    # ── Threshold tuning ──────────────────────────────────────────
    HORIZONTAL_THRESHOLD = 0.15   # scaled offset
    VERTICAL_THRESHOLD   = 0.15

    def __init__(self):
        # No heavy initialization needed for face_recognition
        pass

    def detect_head_pose_from_bytes(
        self, image_bytes: bytes
    ) -> Tuple[Optional[str], Optional[str]]:
        nparr = np.frombuffer(image_bytes, np.uint8)
        bgr   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if bgr is None:
            return None, "Could not decode frame."

        rgb    = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        pose   = self._estimate_pose(rgb)
        return pose, None

    def detect_head_pose_from_frame(self, rgb_frame: np.ndarray) -> str:
        return self._estimate_pose(rgb_frame)

    def _estimate_pose(self, rgb: np.ndarray) -> str:
        landmarks_list = face_recognition.face_landmarks(rgb)
        if not landmarks_list:
            return "no_face"

        lm = landmarks_list[0]
        
        # Required features
        if not all(k in lm for k in ['nose_tip', 'left_eye', 'right_eye', 'chin', 'nose_bridge']):
            return "no_face"

        # Points (x, y)
        nose      = np.array(lm['nose_tip'][2])
        left_eye  = np.array(lm['left_eye'][0])
        right_eye = np.array(lm['right_eye'][3])
        chin      = np.array(lm['chin'][8])
        bridge    = np.array(lm['nose_bridge'][0])

        # Horizontal: Eye midpoint
        eye_mid = (left_eye + right_eye) / 2
        # Vertical: bridge to chin midpoint
        face_mid = (bridge + chin) / 2

        # Scale offsets by face size to be invariant to distance
        face_width  = np.linalg.norm(left_eye - right_eye)
        face_height = np.linalg.norm(bridge - chin)

        if face_width == 0 or face_height == 0:
            return "no_face"

        h_offset = (nose[0] - eye_mid[0]) / face_width
        v_offset = (nose[1] - face_mid[1]) / face_height

        # Pose classification
        if v_offset < -self.VERTICAL_THRESHOLD:
            return "up"
        if v_offset > self.VERTICAL_THRESHOLD:
            return "down"
        if h_offset < -self.HORIZONTAL_THRESHOLD:
            return "left"
        if h_offset > self.HORIZONTAL_THRESHOLD:
            return "right"

        return "center"

    def draw_debug_overlay(self, bgr_frame: np.ndarray, pose: str) -> np.ndarray:
        frame = bgr_frame.copy()
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
