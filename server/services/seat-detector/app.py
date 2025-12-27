from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from PIL import Image
import io
import base64
from typing import List, Dict, Optional
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_visual_layout_fast(image_array: np.ndarray, expected_capacity: Optional[int] = None) -> Dict:
    """
    FAST extraction that preserves visual structure
    Optimized for speed while maintaining accuracy
    """
    start_time = time.time()
    print(f"🎨 Fast visual extraction for {expected_capacity} seats...")
    
    gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    height, width = gray.shape
    
    # Step 1: Quick detection (3 methods only)
    detected_objects = fast_multi_detection(gray, width, height)
    print(f"⏱️ Detection: {time.time() - start_time:.2f}s - Found {len(detected_objects)} objects")
    
    # Step 2: Filter and structure
    seats = filter_and_structure_seats(detected_objects, width, height, expected_capacity)
    print(f"⏱️ Filtering: {time.time() - start_time:.2f}s - Kept {len(seats)} seats")
    
    # Step 3: Match capacity
    if expected_capacity:
        seats = match_to_capacity(seats, expected_capacity, width, height)
        print(f"⏱️ Matching: {time.time() - start_time:.2f}s - Final {len(seats)} seats")
    
    # Step 4: Quick visualization
    visualization = fast_visualization(image_array, seats)
    print(f"✅ Total time: {time.time() - start_time:.2f}s")
    
    return {
        "seats": seats,
        "seatMask": visualization,
        "imageWidth": width,
        "imageHeight": height,
        "layoutType": "visual-preserved",
        "detectionMethod": "fast_cv_optimized"
    }

def fast_multi_detection(gray, width, height):
    """3 fast detection methods"""
    objects = []
    img_area = width * height
    
    # Method 1: Adaptive Threshold (fastest, most reliable)
    for block_size in [11, 21, 31]:
        adaptive = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            block_size, 5
        )
        
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        morphed = cv2.morphologyEx(adaptive, cv2.MORPH_CLOSE, kernel, iterations=1)
        
        contours, _ = cv2.findContours(morphed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if img_area / 15000 < area < img_area / 15:
                M = cv2.moments(contour)
                if M["m00"] != 0:
                    cx = int(M["m10"] / M["m00"])
                    cy = int(M["m01"] / M["m00"])
                    x, y, w, h = cv2.boundingRect(contour)
                    aspect_ratio = w / h if h > 0 else 0
                    
                    if 0.3 < aspect_ratio < 3.0:
                        objects.append({
                            'centroid': {'x': cx, 'y': cy},
                            'bbox': {'x': x, 'y': y, 'width': w, 'height': h},
                            'area': float(area),
                            'confidence': 0.85
                        })
    
    # Method 2: Canny Edges (fast outline detection)
    edges = cv2.Canny(gray, 50, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(edges, kernel, iterations=2)
    
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if img_area / 15000 < area < img_area / 15:
            M = cv2.moments(contour)
            if M["m00"] != 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                x, y, w, h = cv2.boundingRect(contour)
                
                # Check if duplicate
                is_dup = any(
                    np.sqrt((cx - obj['centroid']['x'])**2 + (cy - obj['centroid']['y'])**2) < min(width, height) * 0.03
                    for obj in objects
                )
                
                if not is_dup:
                    objects.append({
                        'centroid': {'x': cx, 'y': cy},
                        'bbox': {'x': x, 'y': y, 'width': w, 'height': h},
                        'area': float(area),
                        'confidence': 0.80
                    })
    
    # Method 3: Simple Blob Detection (circular seats)
    params = cv2.SimpleBlobDetector_Params()
    params.filterByArea = True
    params.minArea = img_area / 10000
    params.maxArea = img_area / 20
    params.filterByCircularity = False
    
    detector = cv2.SimpleBlobDetector_create(params)
    keypoints = detector.detect(gray)
    
    for kp in keypoints:
        cx, cy = int(kp.pt[0]), int(kp.pt[1])
        size = int(kp.size / 2)
        
        is_dup = any(
            np.sqrt((cx - obj['centroid']['x'])**2 + (cy - obj['centroid']['y'])**2) < min(width, height) * 0.03
            for obj in objects
        )
        
        if not is_dup:
            objects.append({
                'centroid': {'x': cx, 'y': cy},
                'bbox': {'x': cx - size, 'y': cy - size, 'width': size*2, 'height': size*2},
                'area': float(size * size),
                'confidence': 0.90
            })
    
    return objects

def filter_and_structure_seats(objects, width, height, expected_capacity):
    """Quick filtering and structuring"""
    if not objects:
        return []
    
    # Remove duplicates
    unique = []
    merge_dist = min(width, height) * 0.03
    
    sorted_obj = sorted(objects, key=lambda o: o['confidence'], reverse=True)
    
    for obj in sorted_obj:
        is_dup = any(
            np.sqrt(
                (obj['centroid']['x'] - u['centroid']['x'])**2 +
                (obj['centroid']['y'] - u['centroid']['y'])**2
            ) < merge_dist
            for u in unique
        )
        
        if not is_dup:
            unique.append(obj)
    
    # Sort by position
    sorted_seats = sorted(unique, key=lambda s: (s['centroid']['y'], s['centroid']['x']))
    
    # Assign row/column
    row_tolerance = height * 0.06
    rows = []
    current_row = [sorted_seats[0]] if sorted_seats else []
    
    for seat in sorted_seats[1:]:
        avg_y = np.mean([s['centroid']['y'] for s in current_row])
        
        if abs(seat['centroid']['y'] - avg_y) < row_tolerance:
            current_row.append(seat)
        else:
            rows.append(current_row)
            current_row = [seat]
    
    if current_row:
        rows.append(current_row)
    
    # Build structured seats
    structured = []
    for row_idx, row in enumerate(rows):
        row_label = chr(65 + row_idx) if row_idx < 26 else f"R{row_idx+1}"
        sorted_row = sorted(row, key=lambda s: s['centroid']['x'])
        
        for col_idx, seat in enumerate(sorted_row):
            structured.append({
                'id': f"S{len(structured) + 1}",
                'seatId': f"{row_label}{col_idx + 1}",
                'row': row_label,
                'column': col_idx + 1,
                'centroid': seat['centroid'],
                'bbox': seat['bbox'],
                'contour': [[seat['bbox']['x'], seat['bbox']['y']],
                           [seat['bbox']['x'] + seat['bbox']['width'], seat['bbox']['y']],
                           [seat['bbox']['x'] + seat['bbox']['width'], seat['bbox']['y'] + seat['bbox']['height']],
                           [seat['bbox']['x'], seat['bbox']['y'] + seat['bbox']['height']]],
                'area': seat['area'],
                'confidence': seat['confidence']
            })
    
    return structured

def match_to_capacity(seats, expected_capacity, width, height):
    """Match detected seats to expected capacity"""
    detected_count = len(seats)
    
    print(f"📊 Detected: {detected_count} | Expected: {expected_capacity}")
    
    # If close enough (within 30%), use detected
    if 0.7 <= detected_count / expected_capacity <= 1.3:
        print(f"✅ Using detected seats (within 30% tolerance)")
        return seats[:expected_capacity] if detected_count > expected_capacity else seats
    
    # If too few detected, generate grid
    if detected_count < expected_capacity * 0.6:
        print(f"🔄 Too few detected ({detected_count}/{expected_capacity}), generating grid")
        return generate_precise_grid(width, height, expected_capacity)
    
    # If too many, keep best ones
    if detected_count > expected_capacity * 1.4:
        print(f"🔽 Too many detected ({detected_count}/{expected_capacity}), filtering")
        sorted_by_conf = sorted(seats, key=lambda s: s['confidence'], reverse=True)
        return sorted_by_conf[:expected_capacity]
    
    return seats

def generate_precise_grid(width, height, capacity):
    """Generate grid with EXACT capacity"""
    print(f"📐 Generating grid: {capacity} seats")
    
    aspect_ratio = width / height
    cols = int(np.ceil(np.sqrt(capacity * aspect_ratio)))
    rows = int(np.ceil(capacity / cols))
    
    seats = []
    padding = 0.05
    seat_width = (width * (1 - padding * 2)) / cols
    seat_height = (height * (1 - padding * 2)) / rows
    start_x = width * padding
    start_y = height * padding
    
    seat_count = 0
    for row_idx in range(rows):
        for col_idx in range(cols):
            if seat_count >= capacity:
                break
            
            cx = int(start_x + col_idx * seat_width + seat_width / 2)
            cy = int(start_y + row_idx * seat_height + seat_height / 2)
            box_w = int(seat_width * 0.6)
            box_h = int(seat_height * 0.6)
            
            seats.append({
                'id': f"S{seat_count + 1}",
                'seatId': f"{chr(65 + row_idx)}{col_idx + 1}",
                'row': chr(65 + row_idx),
                'column': col_idx + 1,
                'centroid': {'x': cx, 'y': cy},
                'bbox': {'x': cx - box_w//2, 'y': cy - box_h//2, 'width': box_w, 'height': box_h},
                'contour': [[cx - box_w//2, cy - box_h//2], [cx + box_w//2, cy - box_h//2],
                           [cx + box_w//2, cy + box_h//2], [cx - box_w//2, cy + box_h//2]],
                'area': float(box_w * box_h),
                'confidence': 1.0
            })
            seat_count += 1
        
        if seat_count >= capacity:
            break
    
    print(f"✅ Grid complete: {len(seats)} seats")
    return seats

def fast_visualization(image_array, seats):
    """Quick visualization"""
    vis = image_array.copy()
    
    for seat in seats:
        cx, cy = seat['centroid']['x'], seat['centroid']['y']
        bbox = seat['bbox']
        
        # Draw box
        cv2.rectangle(vis,
                     (bbox['x'], bbox['y']),
                     (bbox['x'] + bbox['width'], bbox['y'] + bbox['height']),
                     (0, 255, 0), 2)
        
        # Draw center
        cv2.circle(vis, (cx, cy), 4, (255, 0, 0), -1)
        
        # Draw label
        label = seat.get('seatId', seat.get('id', ''))
        cv2.putText(vis, str(label), (cx - 10, cy - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 255, 255), 1)
    
    _, buffer = cv2.imencode('.png', cv2.cvtColor(vis, cv2.COLOR_RGB2BGR))
    return base64.b64encode(buffer).decode('utf-8')

@app.post("/detect-seats")
async def detect_seats(
    file: UploadFile = File(...),
    expected_capacity: Optional[int] = Query(None)
):
    try:
        start = time.time()
        print(f"📥 Received request - Expected: {expected_capacity} seats")
        
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        image_array = np.array(image)
        
        result = extract_visual_layout_fast(image_array, expected_capacity)
        
        print(f"✅ Request completed in {time.time() - start:.2f}s")
        
        return {
            "success": True,
            "layoutType": result["layoutType"],
            "originalWidth": result["imageWidth"],
            "originalHeight": result["imageHeight"],
            "seats": result["seats"],
            "seatMask": result["seatMask"],
            "hasSpatialData": True,
            "totalSeats": len(result["seats"]),
            "expectedSeats": expected_capacity,
            "detectionMethod": result["detectionMethod"],
            "processingTime": f"{time.time() - start:.2f}s"
        }
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)