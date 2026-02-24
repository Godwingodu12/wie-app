from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from PIL import Image
import io
import base64
from typing import List, Dict, Optional
import time
import os
import json
import math
import google.generativeai as genai

def sanitize_for_json(obj):
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_for_json(i) for i in obj]
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

_GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if _GOOGLE_API_KEY:
    genai.configure(api_key=_GOOGLE_API_KEY)
else:
    print("⚠️  GOOGLE_API_KEY not set — Vision AI (Tier 1) will be skipped")

app = FastAPI(title="Seat Detector Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def detect_seats_with_vision_ai(image_array: np.ndarray, expected_capacity: Optional[int]) -> Optional[Dict]:
    """Use Gemini Vision to semantically understand the venue layout. Free: 1500 req/day."""
    if not _GOOGLE_API_KEY:
        return None

    try:
        model     = genai.GenerativeModel("gemini-1.5-pro")
        pil_image = Image.fromarray(image_array)

        max_dim = 2000
        w, h = pil_image.size
        if max(w, h) > max_dim:
            scale     = max_dim / max(w, h)
            pil_image = pil_image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        buf = io.BytesIO()
        pil_image.save(buf, format="PNG")
        buf.seek(0)

        capacity_hint = f"The total expected seat count is {expected_capacity}." if expected_capacity else ""

        prompt = f"""You are an expert venue seating layout analyst. Analyze this seating layout image carefully.
{capacity_hint}

Return ONLY a valid JSON object — no explanation, no markdown fences:
{{
  "venueType": "cinema|theatre|auditorium|stadium|classroom|seminar_hall|arena|conference",
  "stagePosition": "top|bottom|left|right|center|none",
  "totalEstimatedSeats": <number>,
  "sections": [
    {{
      "sectionId": "section-1",
      "sectionName": "Center Block",
      "category": "gold",
      "rows": [
        {{
          "rowLabel": "A",
          "seatCount": 12,
          "curved": false,
          "seats": [
            {{"seatId": "A1", "column": 1, "isAisle": false}},
            {{"seatId": "A2", "column": 2, "isAisle": false}}
          ]
        }}
      ]
    }}
  ],
  "layoutNotes": "any special observations"
}}

Rules:
- Row labels: A, B, C... front to back (closest to stage = A)
- Categories by proximity to stage: diamond (front) → platinum → gold → silver → general (back)
- Mark aisle gaps with isAisle: true
- Separate sections for balcony, stalls, VIP, upper circle etc.
- Set curved: true for theatre/cinema arc rows"""

        response = model.generate_content([
            {"mime_type": "image/png", "data": buf.read()},
            prompt
        ])

        raw = response.text.strip().replace("```json", "").replace("```", "").strip()
        layout_data = json.loads(raw)


        img_w, img_h = pil_image.size
        seats = convert_vision_layout_to_seats(layout_data, img_w, img_h)

        return {
            "seats":           sanitize_for_json(seats),
            "imageWidth":      int(img_w),
            "imageHeight":     int(img_h),
            "layoutType":      "vision-ai",
            "detectionMethod": "gemini_vision",
            "venueType":       layout_data.get("venueType", "general"),
            "stagePosition":   layout_data.get("stagePosition", "top"),
            "sections":        layout_data.get("sections", []),
            "layoutNotes":     layout_data.get("layoutNotes", ""),
        }

    except json.JSONDecodeError as e:
        print(f"⚠️  Gemini JSON parse error: {e} — falling back")
        return None
    except Exception as e:
        print(f"⚠️  Gemini Vision error: {e} — falling back")
        return None


def convert_vision_layout_to_seats(layout_data: Dict, img_w: int, img_h: int) -> List[Dict]:
    """Convert Vision AI JSON into positioned seat objects. All coords are Python int."""
    seats         = []
    sections      = layout_data.get("sections", [])
    stage_pos     = layout_data.get("stagePosition", "top")
    if not sections:
        return seats

    total_sections = len(sections)
    section_width  = img_w / total_sections
    stage_at_top   = stage_pos in ("top", "none", "center")

    for sec_idx, section in enumerate(sections):
        rows       = section.get("rows", [])
        total_rows = len(rows)
        if total_rows == 0:
            continue

        sec_x_start = sec_idx * section_width
        sec_x_end   = (sec_idx + 1) * section_width
        row_height  = (img_h * 0.80) / total_rows
        row_y_start = img_h * 0.10

        for row_idx, row in enumerate(rows):
            row_label = row.get("rowLabel", chr(65 + row_idx))
            row_seats = row.get("seats", [])
            curved    = row.get("curved", False)

            if not row_seats:
                seat_count = row.get("seatCount", 0)
                row_seats  = [{"seatId": f"{row_label}{i+1}", "column": i+1, "isAisle": False}
                               for i in range(seat_count)]

            real_seats      = [s for s in row_seats if not s.get("isAisle", False)]
            total_seat_cols = len(real_seats)
            if total_seat_cols == 0:
                continue

            seat_width = (sec_x_end - sec_x_start) / (total_seat_cols + 1)
            row_y = (row_y_start + row_idx * row_height + row_height / 2) if stage_at_top \
                    else (img_h - row_y_start - row_idx * row_height - row_height / 2)

            real_col = 0
            for seat in row_seats:
                if seat.get("isAisle", False):
                    continue
                real_col += 1
                seat_x   = sec_x_start + real_col * seat_width
                y_offset = 0.0
                if curved and total_seat_cols > 1:
                    center    = (total_seat_cols + 1) / 2
                    norm      = (real_col - center) / center
                    y_offset  = (row_height * 0.35) * (norm ** 2)

                box_w = max(int(seat_width * 0.70), 10)
                box_h = max(int(row_height  * 0.60), 10)
                cx    = int(seat_x)
                cy    = int(row_y + y_offset)

                seats.append({
                    "id":       f"S{len(seats)+1}",
                    "seatId":   str(seat.get("seatId", f"{row_label}{real_col}")),
                    "row":      str(row_label),
                    "column":   int(real_col),
                    "section":  str(section.get("sectionName", "Main")),
                    "category": str(section.get("category", "general")),
                    "centroid": {"x": cx, "y": cy},
                    "bbox":     {"x": cx - box_w//2, "y": cy - box_h//2,
                                 "width": box_w, "height": box_h},
                    "contour": [
                        [cx - box_w//2, cy - box_h//2], [cx + box_w//2, cy - box_h//2],
                        [cx + box_w//2, cy + box_h//2], [cx - box_w//2, cy + box_h//2],
                    ],
                    "area":       float(box_w * box_h),
                    "confidence": 0.95,
                    "curved":     bool(curved),
                })
    return seats

def detect_seats_with_opencv(image_array: np.ndarray, expected_capacity: Optional[int]) -> Optional[Dict]:
    try:
        gray          = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        height, width = gray.shape
        img_area      = width * height
        min_area      = img_area / 12000
        max_area      = img_area / 10
        all_candidates = []

        # Pass 1 — Adaptive Threshold
        for block_size in [9, 15, 21, 31, 41]:
            for c_val in [3, 6, 9]:
                thresh  = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                              cv2.THRESH_BINARY_INV, block_size, c_val)
                kernel  = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
                morphed = cv2.morphologyEx(thresh,  cv2.MORPH_CLOSE, kernel, iterations=2)
                morphed = cv2.morphologyEx(morphed, cv2.MORPH_OPEN,  kernel, iterations=1)
                contours, _ = cv2.findContours(morphed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                _extract_candidates(contours, all_candidates, min_area, max_area, 0.80)

        # Pass 2 — Otsu
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        kernel  = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        otsu    = cv2.morphologyEx(otsu, cv2.MORPH_OPEN, kernel, iterations=1)
        contours, _ = cv2.findContours(otsu, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        _extract_candidates(contours, all_candidates, min_area, max_area, 0.85)

        # Pass 3 — Canny Edges
        blurred = cv2.GaussianBlur(gray, (5, 5), 1)
        edges   = cv2.Canny(blurred, 30, 100)
        kernel  = cv2.getStructuringElement(cv2.MORPH_RECT, (4, 4))
        dilated = cv2.dilate(edges, kernel, iterations=2)
        closed  = cv2.morphologyEx(dilated, cv2.MORPH_CLOSE, kernel, iterations=2)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        _extract_candidates(contours, all_candidates, min_area, max_area, 0.75)

        # Pass 4 — Hough Circles
        blurred2 = cv2.GaussianBlur(gray, (9, 9), 2)
        min_r    = int(math.sqrt(min_area / math.pi))
        max_r    = int(math.sqrt(max_area / math.pi))
        circles  = cv2.HoughCircles(blurred2, cv2.HOUGH_GRADIENT, dp=1.2, minDist=min_r * 2,
                       param1=60, param2=25, minRadius=max(3, min_r), maxRadius=min(max_r, 50))
        if circles is not None:
            for (cx, cy, r) in np.round(circles[0]).astype(int):
                all_candidates.append({
                    "centroid": {"x": int(cx), "y": int(cy)},
                    "bbox":     {"x": int(cx-r), "y": int(cy-r), "width": int(r*2), "height": int(r*2)},
                    "area":     float(math.pi * r * r),
                    "confidence": 0.90,
                })

        if not all_candidates:
            return None

        unique = deduplicate_candidates(all_candidates, min(width, height) * 0.025)
        seats = assign_rows_and_columns(unique, height)

        if expected_capacity and seats:
            ratio = len(seats) / expected_capacity
            if ratio < 0.5 or ratio > 2.0:
                print(f"   OpenCV ratio {ratio:.2f} out of range — skipping")
                return None
            if len(seats) > expected_capacity:
                seats = sorted(seats, key=lambda s: s["confidence"], reverse=True)[:expected_capacity]

        return {
            "seats":           sanitize_for_json(seats),
            "imageWidth":      int(width),
            "imageHeight":     int(height),
            "layoutType":      "opencv-detected",
            "detectionMethod": "enhanced_opencv",
        }

    except Exception as e:
        print(f"⚠️  OpenCV error: {e}")
        return None


def _extract_candidates(contours, candidates, min_area, max_area, confidence):
    """Extract candidates from contours. All coords cast to Python int."""
    for contour in contours:
        area = cv2.contourArea(contour)
        if not (min_area < area < max_area):
            continue
        M = cv2.moments(contour)
        if M["m00"] == 0:
            continue
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
        x, y, w, h = cv2.boundingRect(contour)
        aspect = w / h if h > 0 else 0
        if not (0.2 < aspect < 5.0):
            continue
        candidates.append({
            "centroid":   {"x": int(cx), "y": int(cy)},
            "bbox":       {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
            "area":       float(area),
            "confidence": float(confidence),
        })


def deduplicate_candidates(candidates, merge_dist):
    sorted_c = sorted(candidates, key=lambda o: o["confidence"], reverse=True)
    unique   = []
    for obj in sorted_c:
        cx, cy = obj["centroid"]["x"], obj["centroid"]["y"]
        if not any(math.sqrt((cx-u["centroid"]["x"])**2 + (cy-u["centroid"]["y"])**2) < merge_dist
                   for u in unique):
            unique.append(obj)
    return unique


def assign_rows_and_columns(objects, image_height):
    """Assign row labels and column numbers. All values are Python int."""
    if not objects:
        return []

    sorted_seats  = sorted(objects, key=lambda s: (s["centroid"]["y"], s["centroid"]["x"]))
    row_tolerance = image_height * 0.05
    rows          = []
    current_row   = [sorted_seats[0]]

    for seat in sorted_seats[1:]:
        avg_y = sum(s["centroid"]["y"] for s in current_row) / len(current_row)
        if abs(seat["centroid"]["y"] - avg_y) < row_tolerance:
            current_row.append(seat)
        else:
            rows.append(sorted(current_row, key=lambda s: s["centroid"]["x"]))
            current_row = [seat]
    if current_row:
        rows.append(sorted(current_row, key=lambda s: s["centroid"]["x"]))

    structured = []
    for row_idx, row in enumerate(rows):
        row_label = chr(65 + row_idx) if row_idx < 26 else f"R{row_idx+1}"
        for col_idx, seat in enumerate(row):
            cx = int(seat["centroid"]["x"])
            cy = int(seat["centroid"]["y"])
            bx = int(seat["bbox"]["x"])
            by = int(seat["bbox"]["y"])
            bw = int(seat["bbox"]["width"])
            bh = int(seat["bbox"]["height"])
            structured.append({
                "id":       f"S{len(structured)+1}",
                "seatId":   f"{row_label}{col_idx+1}",
                "row":      str(row_label),
                "column":   int(col_idx + 1),
                "section":  "Main",
                "category": "general",
                "centroid": {"x": cx, "y": cy},
                "bbox":     {"x": bx, "y": by, "width": bw, "height": bh},
                "contour": [
                    [cx - bw//2, cy - bh//2], [cx + bw//2, cy - bh//2],
                    [cx + bw//2, cy + bh//2], [cx - bw//2, cy + bh//2],
                ],
                "area":       float(seat["area"]),
                "confidence": float(seat["confidence"]),
                "curved":     False,
            })
    return structured

def generate_smart_grid(width: int, height: int, capacity: int,
                        venue_type: str = "general") -> List[Dict]:
    venue_params = {
        "cinema":       {"aisle_ratio": 0.33, "stage_gap": 0.08, "curved": True},
        "theatre":      {"aisle_ratio": 0.33, "stage_gap": 0.10, "curved": True},
        "auditorium":   {"aisle_ratio": 0.33, "stage_gap": 0.10, "curved": True},
        "classroom":    {"aisle_ratio": 0.00, "stage_gap": 0.05, "curved": False},
        "seminar_hall": {"aisle_ratio": 0.50, "stage_gap": 0.08, "curved": False},
        "stadium":      {"aisle_ratio": 0.25, "stage_gap": 0.12, "curved": True},
        "arena":        {"aisle_ratio": 0.25, "stage_gap": 0.12, "curved": True},
    }
    params = venue_params.get(venue_type, {"aisle_ratio": 0.33, "stage_gap": 0.08, "curved": False})

    aspect       = width / height
    cols         = int(math.ceil(math.sqrt(capacity * aspect * 1.1)))
    rows_needed  = int(math.ceil(capacity / cols))
    margin_x     = width  * 0.06
    margin_y_top = height * (params["stage_gap"] + 0.05)
    usable_w     = width  - 2 * margin_x
    usable_h     = height - margin_y_top - height * 0.05
    seat_w       = usable_w / (cols + 0.5)
    seat_h       = usable_h / rows_needed
    box_w        = max(int(seat_w * 0.72), 8)
    box_h        = max(int(seat_h * 0.70), 8)

    aisle_cols = set()
    if params["aisle_ratio"] > 0 and cols > 4:
        aisle_cols.add(cols // 2)
        if params["aisle_ratio"] <= 0.33 and cols > 8:
            aisle_cols.add(cols // 4)
            aisle_cols.add(3 * cols // 4)

    seats      = []
    seat_count = 0

    for row_idx in range(rows_needed):
        if seat_count >= capacity:
            break
        row_label    = chr(65 + row_idx) if row_idx < 26 else f"R{row_idx+1}"
        row_y_center = margin_y_top + (row_idx + 0.5) * seat_h
        col_real     = 0

        for col_idx in range(cols):
            if seat_count >= capacity:
                break
            if col_idx in aisle_cols:
                continue

            col_real += 1
            seat_x   = margin_x + col_idx * seat_w + seat_w / 2
            y_offset = 0.0
            if params["curved"] and cols > 1:
                norm     = (col_idx - cols / 2) / (cols / 2)
                y_offset = (seat_h * 0.40) * (norm ** 2)

            cx = int(seat_x)
            cy = int(row_y_center + y_offset)

            row_fraction = row_idx / rows_needed
            if   row_fraction < 0.15: cat = "diamond"
            elif row_fraction < 0.30: cat = "platinum"
            elif row_fraction < 0.55: cat = "gold"
            elif row_fraction < 0.75: cat = "silver"
            else:                      cat = "general"

            seats.append({
                "id":       f"S{seat_count+1}",
                "seatId":   f"{row_label}{col_real}",
                "row":      str(row_label),
                "column":   int(col_real),
                "section":  "Main",
                "category": str(cat),
                "centroid": {"x": cx, "y": cy},
                "bbox":     {"x": cx - box_w//2, "y": cy - box_h//2,
                             "width": int(box_w), "height": int(box_h)},
                "contour": [
                    [cx - box_w//2, cy - box_h//2], [cx + box_w//2, cy - box_h//2],
                    [cx + box_w//2, cy + box_h//2], [cx - box_w//2, cy + box_h//2],
                ],
                "area":       float(box_w * box_h),
                "confidence": 1.0,
                "curved":     bool(params["curved"]),
            })
            seat_count += 1

    return seats

CATEGORY_COLORS_BGR = {
    "diamond":  (178,  55, 242),
    "platinum": (  0, 193, 229),
    "gold":     (  0, 166, 245),
    "silver":   (168, 168, 168),
    "general":  (226, 149,  74),
}

def generate_visualization(image_array: np.ndarray, seats: List[Dict],
                            venue_type: str = "general",
                            stage_position: str = "top") -> str:
    """Draws color-coded seat boxes over the original image. Returns base64 PNG."""
    vis     = image_array.copy()
    overlay = vis.copy()
    h, w    = vis.shape[:2]

    for seat in seats:
        bbox  = seat.get("bbox", {})
        color = CATEGORY_COLORS_BGR.get(seat.get("category", "general"), (128, 128, 128))
        x, y  = int(bbox.get("x", 0)), int(bbox.get("y", 0))
        bw, bh = int(bbox.get("width", 20)), int(bbox.get("height", 20))
        cv2.rectangle(overlay, (x, y), (x+bw, y+bh), color, -1)

    vis = cv2.addWeighted(overlay, 0.45, vis, 0.55, 0)

    for seat in seats:
        bbox   = seat.get("bbox", {})
        cx, cy = int(seat["centroid"]["x"]), int(seat["centroid"]["y"])
        color  = CATEGORY_COLORS_BGR.get(seat.get("category", "general"), (128, 128, 128))
        x, y   = int(bbox.get("x", 0)), int(bbox.get("y", 0))
        bw, bh = int(bbox.get("width", 20)), int(bbox.get("height", 20))
        cv2.rectangle(vis, (x, y), (x+bw, y+bh), color, 1)
        cv2.circle(vis, (cx, cy), 2, (255, 255, 255), -1)
        font_scale = max(0.18, min(bw / 45, 0.35))
        cv2.putText(vis, str(seat.get("seatId", "")), (x+1, y+bh-2),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), 1, cv2.LINE_AA)

    stage_h = max(int(h * 0.04), 20)
    stage_w = int(w * 0.50)
    stage_x = (w - stage_w) // 2
    if stage_position == "top":
        cv2.rectangle(vis, (stage_x, 5), (stage_x+stage_w, 5+stage_h), (30, 30, 30), -1)
        cv2.putText(vis, "STAGE / SCREEN", (stage_x+10, 5+stage_h-5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    elif stage_position == "bottom":
        cv2.rectangle(vis, (stage_x, h-stage_h-5), (stage_x+stage_w, h-5), (30, 30, 30), -1)
        cv2.putText(vis, "STAGE / SCREEN", (stage_x+10, h-8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

    legend_y = h - 25 if stage_position != "bottom" else 10
    lx = 8
    for cat, color in CATEGORY_COLORS_BGR.items():
        cv2.rectangle(vis, (lx, legend_y-10), (lx+14, legend_y+4), color, -1)
        cv2.putText(vis, cat.capitalize(), (lx+17, legend_y+3),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.32, (255, 255, 255), 1, cv2.LINE_AA)
        lx += 80

    vis_bgr = cv2.cvtColor(vis, cv2.COLOR_RGB2BGR)
    _, buf   = cv2.imencode(".png", vis_bgr)
    return base64.b64encode(buf).decode("utf-8")

@app.post("/detect-seats")
async def detect_seats(
    file:              UploadFile    = File(...),
    expected_capacity: Optional[int] = Query(None),
    venue_type:        Optional[str] = Query(None),
):
    start = time.time()
    try:
        contents     = await file.read()
        pil_image    = Image.open(io.BytesIO(contents)).convert("RGB")
        image_array  = np.array(pil_image)
        img_h, img_w = image_array.shape[:2]
        result         = None
        detection_tier = None
        detected_venue = venue_type or "general"
        stage_pos      = "top"

        # Tier 1 — Gemini Vision AI
        result = detect_seats_with_vision_ai(image_array, expected_capacity)
        if result and result.get("seats"):
            detection_tier = "vision_ai"
            detected_venue = result.get("venueType", detected_venue)
            stage_pos      = result.get("stagePosition", "top")
        else:
            # Tier 2 — Enhanced OpenCV
            result = detect_seats_with_opencv(image_array, expected_capacity)
            if result and result.get("seats"):
                detection_tier = "enhanced_opencv"
            else:
                # Tier 3 — Smart Grid
                cap   = expected_capacity or 100
                seats = generate_smart_grid(img_w, img_h, cap, detected_venue)
                result = {
                    "seats":           seats,
                    "imageWidth":      int(img_w),
                    "imageHeight":     int(img_h),
                    "layoutType":      "grid-generated",
                    "detectionMethod": "smart_grid_fallback",
                }
                detection_tier = "smart_grid"

        seats = result["seats"]

        # Capacity adjustment
        if expected_capacity and len(seats) != expected_capacity:
            if len(seats) > expected_capacity:
                seats = seats[:expected_capacity]
            elif detection_tier != "vision_ai":
                shortage = expected_capacity - len(seats)
                if shortage / expected_capacity > 0.15:
                    extra = generate_smart_grid(img_w, img_h, shortage, detected_venue)
                    seats.extend(extra[:shortage])

        seat_mask       = generate_visualization(image_array, seats, detected_venue, stage_pos)
        processing_time = f"{time.time() - start:.2f}s"

        # ✅ sanitize_for_json on the ENTIRE response dict as final safety net
        return sanitize_for_json({
            "success":         True,
            "layoutType":      result.get("layoutType", "detected"),
            "originalWidth":   int(img_w),
            "originalHeight":  int(img_h),
            "seats":           seats,
            "seatMask":        seat_mask,
            "hasSpatialData":  True,
            "totalSeats":      int(len(seats)),
            "expectedSeats":   expected_capacity,
            "detectionMethod": result.get("detectionMethod", detection_tier),
            "detectionTier":   detection_tier,
            "venueType":       detected_venue,
            "stagePosition":   stage_pos,
            "processingTime":  processing_time,
            "sections":        result.get("sections", []),
            "layoutNotes":     result.get("layoutNotes", ""),
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Fatal error: {e}")
        return {"success": False, "error": str(e)}


@app.get("/health")
async def health():
    return {
        "status":    "healthy",
        "vision_ai": "gemini_free" if _GOOGLE_API_KEY else "disabled — set GOOGLE_API_KEY in .env",
        "opencv":    "enabled",
        "fallback":  "smart_grid enabled",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
