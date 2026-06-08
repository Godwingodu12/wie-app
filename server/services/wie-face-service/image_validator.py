"""
WIE Connection Platform — Image Validation Service
Only two checks:
 1. Exactly one face (no group photos)
 2. Eyes visible (no heavy obstruction — masks/helmets/sunglasses)

Note: MediaPipe dependency removed in favor of face_recognition landmarks 
to ensure compatibility across Python versions.
"""
import cv2
import numpy as np
import face_recognition
from dataclasses import dataclass
from typing import Optional, List, Tuple


@dataclass
class ValidationResult:
    passed:  bool
    code:    str
    message: str


PASS = ValidationResult(passed=True, code="ok", message="Image passed all validation checks.")

class ImageValidator:

    def validate(self, bgr: np.ndarray) -> ValidationResult:
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

        # 1. Check face count
        count_check = self._check_face_count(rgb)
        if count_check and not count_check.passed:
            return count_check

        # 2. Check eyes (landmarks)
        eye_check = self._check_eyes_open(rgb)
        if eye_check and not eye_check.passed:
            return eye_check

        return PASS

    def _check_face_count(self, rgb) -> Optional[ValidationResult]:
        # Upsample once for speed/accuracy balance
        locations = face_recognition.face_locations(rgb, model="hog")

        if not locations:
            # Fallback to CNN for difficult images (slower)
            try:
                locations = face_recognition.face_locations(rgb, model="cnn")
            except:
                pass

        if len(locations) == 0:
            return ValidationResult(
                passed=False,
                code="no_face_detected",
                message="No face detected. Please upload a clear photo showing your face."
            )
        if len(locations) > 1:
            return ValidationResult(
                passed=False,
                code="multiple_faces",
                message="Multiple faces detected. Please upload a solo photo."
            )
        return None

    def _check_eyes_open(self, rgb) -> Optional[ValidationResult]:
        """
        Verify eyes are open using EAR (Eye Aspect Ratio).
        """
        landmarks_list = face_recognition.face_landmarks(rgb)
        if not landmarks_list:
            return None # Already checked count, this is a fallback safety

        landmarks = landmarks_list[0]
        
        if 'left_eye' not in landmarks or 'right_eye' not in landmarks:
            return None

        def get_ear(eye: List[Tuple[int, int]]) -> float:
            # eye: [p1, p2, p3, p4, p5, p6]
            # p2-p6, p3-p5 (vertical) / p1-p4 (horizontal)
            v1 = np.linalg.norm(np.array(eye[1]) - np.array(eye[5]))
            v2 = np.linalg.norm(np.array(eye[2]) - np.array(eye[4]))
            h  = np.linalg.norm(np.array(eye[0]) - np.array(eye[3]))
            return (v1 + v2) / (2.0 * h) if h > 0 else 0

        left_ear  = get_ear(landmarks['left_eye'])
        right_ear = get_ear(landmarks['right_eye'])
        avg_ear   = (left_ear + right_ear) / 2.0

        # Standard threshold for open eyes is ~0.2. 
        # Below 0.15 usually means closed or heavily obstructed.
        if avg_ear < 0.15:
            return ValidationResult(
                passed=False,
                code="eyes_not_visible",
                message="Eyes are not clearly visible. Please remove sunglasses or masks."
            )
        return None


validator = ImageValidator()


def validate_image_bytes(image_bytes: bytes) -> ValidationResult:
    nparr = np.frombuffer(image_bytes, np.uint8)
    bgr   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if bgr is None:
        return ValidationResult(
            passed=False,
            code="image_decode_failed",
            message="Could not read image file."
        )

    return validator.validate(bgr)
