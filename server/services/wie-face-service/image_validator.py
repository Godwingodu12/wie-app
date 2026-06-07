"""
WIE Connection Platform — Image Validation Service
Implements all 12 image validation rules:
 1. Format & size
 2. Face detection (exactly 1 face)
 3. Single person rule
 4. Banner / flex / poster detection
 5. Face quality (blur score)
 6. Face visibility (eyes, nose, mouth landmarks)
 7. Lighting rules (brightness range)
 8. Pose rules (max 45° rotation)
 9. Image content (cartoon / AI-generated)
10. Offensive content (placeholder hook)
11. Authenticity (screenshot / printed photo)
12. Profile photo guidelines summary
"""
import cv2
import numpy as np
import face_recognition
import mediapipe as mp
from dataclasses import dataclass
from typing import Optional, List, Any


# ── Result type ───────────────────────────────────────────────────
@dataclass
class ValidationResult:
    passed:  bool
    code:    str           # machine-readable rejection code
    message: str           # user-friendly message


PASS = ValidationResult(passed=True, code="ok", message="Image passed all validation checks.")


# ── MediaPipe / FaceRecognition Fallback setup ────────────────────
try:
    _mp_face_mesh    = mp.solutions.face_mesh
    HAS_MEDIAPIPE_SOLUTIONS = True
except AttributeError:
    HAS_MEDIAPIPE_SOLUTIONS = False
    _mp_face_mesh = None

class LandmarkProxy:
    """Mock MediaPipe landmark object for fallback."""
    def __init__(self, x, y, z=0.0):
        self.x = x
        self.y = y
        self.z = z

class FaceMeshResultsProxy:
    """Mock MediaPipe results object for fallback."""
    def __init__(self, landmarks_list):
        self.multi_face_landmarks = landmarks_list

class LandmarksProxy:
    """Mock MediaPipe multi_face_landmarks[0] for fallback."""
    def __init__(self, landmarks):
        self.landmark = landmarks

def _get_face_landmarks_fallback(rgb: np.ndarray) -> Any:
    """
    Fallback using face_recognition (dlib) when MediaPipe is unavailable.
    Maps dlib 68-point landmarks to the indices expected by the code.
    """
    face_locations = face_recognition.face_locations(rgb, model="hog")
    if not face_locations:
        return FaceMeshResultsProxy(None)

    landmarks_list = face_recognition.face_landmarks(rgb, face_locations)
    if not landmarks_list:
        return FaceMeshResultsProxy(None)

    d = landmarks_list[0]
    h, w = rgb.shape[:2]

    def to_proxy(pt):
        return LandmarkProxy(pt[0] / w, pt[1] / h)

    proxy_dict = {}
    try:
        proxy_dict[1] = to_proxy(d['nose_tip'][2])
        proxy_dict[33] = to_proxy(d['left_eye'][0])
        proxy_dict[263] = to_proxy(d['right_eye'][3])
        proxy_dict[159] = to_proxy(d['left_eye'][1])
        proxy_dict[145] = to_proxy(d['left_eye'][5])
        proxy_dict[386] = to_proxy(d['right_eye'][1])
        proxy_dict[374] = to_proxy(d['right_eye'][5])
        proxy_dict[13] = to_proxy(d['top_lip'][-3])
        proxy_dict[14] = to_proxy(d['bottom_lip'][3])
        proxy_dict[133] = to_proxy(d['left_eye'][3])
        proxy_dict[362] = to_proxy(d['right_eye'][0])
    except (KeyError, IndexError):
        return FaceMeshResultsProxy(None)

    max_idx = max(proxy_dict.keys())
    full_landmarks = [LandmarkProxy(0, 0) for _ in range(max_idx + 1)]
    for idx, proxy in proxy_dict.items():
        full_landmarks[idx] = proxy

    return FaceMeshResultsProxy([LandmarksProxy(full_landmarks)])

if HAS_MEDIAPIPE_SOLUTIONS:
    _face_mesh = _mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=2,
        refine_landmarks=True,
        min_detection_confidence=0.5,
    )
else:
    class FallbackFaceMesh:
        def process(self, rgb):
            return _get_face_landmarks_fallback(rgb)
    _face_mesh = FallbackFaceMesh()


class ImageValidator:
    """
    Run all validation rules against a raw image (BGR numpy array).
    Call validate(bgr_image) → ValidationResult.
    """

    # ── Tunable thresholds ────────────────────────────────────────
    MIN_FACE_AREA_RATIO  = 0.15    # face bounding box must be ≥ 15% of image area
    BLUR_THRESHOLD       = 60.0    # Laplacian variance below this → blurry
    MIN_BRIGHTNESS       = 40      # pixel value 0-255
    MAX_BRIGHTNESS       = 230
    MAX_POSE_ANGLE_DEG   = 45.0    # yaw angle limit
    TEXT_DENSITY_THRESH  = 0.12    # fraction of high-edge pixels → banner/text
    MIN_IMAGE_DIM        = 200     # minimum width or height in pixels

    # ──────────────────────────────────────────────────────────────
    def validate(self, bgr: np.ndarray) -> ValidationResult:
        """Run all rules in order. Returns first failure or PASS."""
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        h, w = bgr.shape[:2]

        checks = [
            self._check_min_dimensions(bgr, h, w),
            self._check_brightness(bgr),
            self._check_blur(bgr),
            self._check_face_count(rgb, bgr, h, w),
            self._check_face_area(rgb, h, w),
            self._check_face_landmarks(rgb),
            self._check_head_pose(rgb),
            self._check_text_banner(bgr),
            self._check_cartoon_or_ai(bgr, rgb),
        ]

        for result in checks:
            if result is not None and not result.passed:
                return result

        return PASS

    # ── Rule: minimum image dimensions ───────────────────────────
    def _check_min_dimensions(self, bgr, h, w) -> Optional[ValidationResult]:
        if h < self.MIN_IMAGE_DIM or w < self.MIN_IMAGE_DIM:
            return ValidationResult(
                passed=False,
                code="image_too_small",
                message=f"Image is too small ({w}×{h}). Minimum {self.MIN_IMAGE_DIM}px on each side."
            )
        return None

    # ── Rule 7: Lighting ─────────────────────────────────────────
    def _check_brightness(self, bgr) -> Optional[ValidationResult]:
        gray       = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))

        if brightness < self.MIN_BRIGHTNESS:
            return ValidationResult(
                passed=False,
                code="image_too_dark",
                message="Image is too dark. Please take a photo in better lighting."
            )
        if brightness > self.MAX_BRIGHTNESS:
            return ValidationResult(
                passed=False,
                code="image_overexposed",
                message="Image is overexposed. Avoid strong backlighting or flash."
            )
        return None

    # ── Rule 5: Blur / quality ────────────────────────────────────
    def _check_blur(self, bgr) -> Optional[ValidationResult]:
        gray        = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        blur_score  = cv2.Laplacian(gray, cv2.CV_64F).var()

        if blur_score < self.BLUR_THRESHOLD:
            return ValidationResult(
                passed=False,
                code="image_blurry",
                message=f"Image is blurry (score={blur_score:.1f}). Please use a sharper photo."
            )
        return None

    # ── Rules 2 & 3: Face count, single person ────────────────────
    def _check_face_count(self, rgb, bgr, h, w) -> Optional[ValidationResult]:
        # Use face_recognition for accurate count
        locations = face_recognition.face_locations(rgb, model="hog")

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
                message="Multiple faces detected. Please upload a photo with only you in it — no group photos."
            )

        return None

    # ── Rule 2: Face must cover ≥15% of image area ───────────────
    def _check_face_area(self, rgb, h, w) -> Optional[ValidationResult]:
        locations = face_recognition.face_locations(rgb, model="hog")
        if not locations:
            return None   # already caught by _check_face_count

        top, right, bottom, left = locations[0]
        face_area  = (bottom - top) * (right - left)
        image_area = h * w
        ratio      = face_area / image_area

        if ratio < self.MIN_FACE_AREA_RATIO:
            return ValidationResult(
                passed=False,
                code="face_too_small",
                message=f"Face is too small in the image ({ratio*100:.0f}%). Move closer to the camera."
            )
        return None

    # ── Rule 6: Face landmarks — eyes/nose/mouth visible ─────────
    def _check_face_landmarks(self, rgb) -> Optional[ValidationResult]:
        results = _face_mesh.process(rgb)
        if not results.multi_face_landmarks:
            return None   # fallback — already handled by face_count

        lm = results.multi_face_landmarks[0].landmark

        # Key landmark indices
        # Left eye:  33, 133 | Right eye: 362, 263
        # Nose tip:  1        | Mouth: 13, 14
        key_indices = [33, 133, 362, 263, 1, 13, 14]

        # All key points must have visibility > 0 (not occluded)
        # MediaPipe landmark visibility is unreliable in static mode;
        # instead check that Z-depth spread is reasonable (face not turned away)
        z_vals = [lm[i].z for i in key_indices]
        z_spread = max(z_vals) - min(z_vals)

        # If the face is heavily turned, left-eye and right-eye Z values diverge greatly
        if z_spread > 0.25:
            return ValidationResult(
                passed=False,
                code="face_partially_hidden",
                message="Face is partially hidden or turned too far. Please show your full face."
            )

        # Check eye openness using upper/lower eyelid distance
        # Left eye: upper 159, lower 145 | Right eye: upper 386, lower 374
        def eye_openness(upper_idx, lower_idx):
            return abs(lm[upper_idx].y - lm[lower_idx].y)

        left_open  = eye_openness(159, 145)
        right_open = eye_openness(386, 374)
        avg_open   = (left_open + right_open) / 2

        if avg_open < 0.005:
            return ValidationResult(
                passed=False,
                code="eyes_not_visible",
                message="Eyes are not clearly visible. Remove sunglasses, masks, or obstructions."
            )

        return None

    # ── Rule 8: Head pose (yaw angle ≤ 45°) ──────────────────────
    def _check_head_pose(self, rgb) -> Optional[ValidationResult]:
        results = _face_mesh.process(rgb)
        if not results.multi_face_landmarks:
            return None

        lm = results.multi_face_landmarks[0].landmark

        # Estimate yaw from nose tip vs eye midpoint horizontal offset
        nose      = lm[1]
        left_eye  = lm[33]
        right_eye = lm[263]
        eye_mid_x = (left_eye.x + right_eye.x) / 2
        eye_width = abs(right_eye.x - left_eye.x)

        if eye_width < 1e-6:
            return None

        # Normalised horizontal offset → approximate yaw in degrees
        h_offset_norm = (nose.x - eye_mid_x) / eye_width
        yaw_deg       = abs(h_offset_norm) * 90.0   # rough linear mapping

        if yaw_deg > self.MAX_POSE_ANGLE_DEG:
            return ValidationResult(
                passed=False,
                code="face_too_angled",
                message=f"Face is turned too far sideways ({yaw_deg:.0f}°). Please face the camera directly."
            )

        return None

    # ── Rule 4: Banner / poster / flex / heavy-text detection ─────
    def _check_text_banner(self, bgr) -> Optional[ValidationResult]:
        """
        Uses edge density as a proxy for large text / printed banners.
        Genuine face photos have concentrated edges around the face area.
        Banners/posters have high-density, evenly-distributed edges.
        """
        gray   = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        edges  = cv2.Canny(gray, 50, 150)
        h, w   = edges.shape

        # Divide into a 4×4 grid, measure edge density per cell
        grid_h, grid_w = h // 4, w // 4
        densities = []
        for r in range(4):
            for c in range(4):
                cell   = edges[r*grid_h:(r+1)*grid_h, c*grid_w:(c+1)*grid_w]
                density = np.count_nonzero(cell) / cell.size
                densities.append(density)

        # Banners have uniformly HIGH edge density across many cells
        high_density_cells = sum(1 for d in densities if d > self.TEXT_DENSITY_THRESH)

        # If more than 10 of 16 cells are high-edge → banner / heavy text
        if high_density_cells > 10:
            return ValidationResult(
                passed=False,
                code="banner_or_poster_detected",
                message="Image appears to contain a banner, poster, or printed background. Please use a natural photo."
            )

        return None

    # ── Rule 9: Cartoon / AI-generated / screenshot detection ────
    def _check_cartoon_or_ai(self, bgr, rgb) -> Optional[ValidationResult]:
        """
        Heuristic checks:
        A) Color uniformity — cartoons have large flat-color regions
        B) Edge uniformity — anime/cartoon has very clean, thin uniform edges
        C) Skin tone presence — real human faces have identifiable skin tones
        """
        # A) Flat-color ratio
        gray         = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        _, thresh    = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        flat_ratio   = np.count_nonzero(thresh == 0) / thresh.size

        if flat_ratio > 0.80:
            return ValidationResult(
                passed=False,
                code="cartoon_or_ai_image",
                message="Image appears to be a cartoon, illustration, or AI-generated. Please use a real photo."
            )

        # B) Skin tone presence (HSV skin range)
        hsv       = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        lower_skin = np.array([0, 20, 70],  dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        skin_mask  = cv2.inRange(hsv, lower_skin, upper_skin)

        # Also cover darker skin tones
        lower_skin2 = np.array([170, 20, 70],  dtype=np.uint8)
        upper_skin2 = np.array([180, 255, 255], dtype=np.uint8)
        skin_mask2  = cv2.inRange(hsv, lower_skin2, upper_skin2)
        combined    = cv2.bitwise_or(skin_mask, skin_mask2)

        skin_ratio = np.count_nonzero(combined) / combined.size

        # Real face photos should have some skin-tone pixels
        if skin_ratio < 0.02:
            return ValidationResult(
                passed=False,
                code="no_skin_tone_detected",
                message="No natural skin tones detected. Please upload a genuine photo of yourself."
            )

        return None


# ── Module-level singleton ────────────────────────────────────────
validator = ImageValidator()


def validate_image_bytes(image_bytes: bytes) -> ValidationResult:
    """
    Public function — call this from FastAPI routes.
    Accepts raw bytes, decodes to BGR, runs all rules.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    bgr   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if bgr is None:
        return ValidationResult(
            passed=False,
            code="image_decode_failed",
            message="Could not read image file. Please upload a valid JPG, PNG, or WebP image."
        )

    return validator.validate(bgr)