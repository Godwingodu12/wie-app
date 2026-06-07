"""
WIE Connection Platform — Image Validation Service
Only two checks:
 1. Exactly one face (no group photos)
 2. Eyes visible (no heavy obstruction — masks/helmets/sunglasses)
"""
import cv2
import numpy as np
import face_recognition
import mediapipe as mp
from dataclasses import dataclass
from typing import Optional


@dataclass
class ValidationResult:
    passed:  bool
    code:    str
    message: str


PASS = ValidationResult(passed=True, code="ok", message="Image passed all validation checks.")

_face_mesh = mp.solutions.face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=2,
    refine_landmarks=True,
    min_detection_confidence=0.4,
)


class ImageValidator:

    def validate(self, bgr: np.ndarray) -> ValidationResult:
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

        for check in [
            self._check_face_count(rgb),
            self._check_face_landmarks(rgb),
        ]:
            if check is not None and not check.passed:
                return check

        return PASS

    def _check_face_count(self, rgb) -> Optional[ValidationResult]:
        # Upsample twice so small/distant faces are caught by HOG
        locations = face_recognition.face_locations(
            rgb, model="hog", number_of_times_to_upsample=2
        )

        # CNN fallback for difficult images
        if not locations:
            locations = face_recognition.face_locations(rgb, model="cnn")

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
                message="Multiple faces detected. Please upload a solo photo — no group or couple photos."
            )
        return None

    def _check_face_landmarks(self, rgb) -> Optional[ValidationResult]:
        results = _face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            # face_recognition already confirmed a face — pass leniently
            return None

        lm = results.multi_face_landmarks[0].landmark

        def eye_openness(upper_idx, lower_idx):
            return abs(lm[upper_idx].y - lm[lower_idx].y)

        avg_open = (eye_openness(159, 145) + eye_openness(386, 374)) / 2

        if avg_open < 0.002:
            return ValidationResult(
                passed=False,
                code="eyes_not_visible",
                message="Eyes are not clearly visible. Please remove sunglasses, masks, or helmets."
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
            message="Could not read image file. Please upload a valid JPG, PNG, or WebP image."
        )

    return validator.validate(bgr)
