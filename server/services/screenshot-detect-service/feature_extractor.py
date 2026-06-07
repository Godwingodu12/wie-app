"""
Extract numerical features from an image for the ML classifier.
"""

from PIL import Image, ImageFilter
import numpy as np
import io


def extract_features(image_bytes: bytes) -> np.ndarray:
    """
    Returns a 1D feature vector:
    [aspect_ratio, color_variance, edge_density, uniform_ratio, brightness_std]
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size

    # 1. Aspect ratio
    aspect_ratio = w / h if h > 0 else 1.0

    # 2. Color variance — screenshots have low variance (UI palette)
    arr = np.array(img, dtype=np.float32) / 255.0
    color_variance = float(np.var(arr))

    # 3. Edge density — screenshots have sharp UI edges
    gray = img.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_arr = np.array(edges, dtype=np.float32) / 255.0
    edge_density = float(np.mean(edge_arr))

    # 4. Uniform region ratio — status/nav bars create large uniform blocks
    # Count pixels whose local neighborhood variance is near 0
    small = gray.resize((64, 64))
    s_arr = np.array(small, dtype=np.float32)
    # Sliding 4x4 block variance
    block_vars = []
    for i in range(0, 60, 4):
        for j in range(0, 60, 4):
            block = s_arr[i:i+4, j:j+4]
            block_vars.append(float(np.var(block)))
    uniform_ratio = float(sum(1 for v in block_vars if v < 5.0) / len(block_vars))

    # 5. Brightness std — controlled UI vs natural light
    brightness = np.array(gray, dtype=np.float32)
    brightness_std = float(np.std(brightness))

    return np.array([[aspect_ratio, color_variance, edge_density, uniform_ratio, brightness_std]])