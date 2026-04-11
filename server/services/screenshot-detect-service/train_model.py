"""
Train a lightweight screenshot classifier.
Features extracted from image metadata/visual patterns:
- aspect ratio
- color histogram variance (screenshots tend to have UI colors)
- edge density (UI has sharp edges)
- uniform region ratio (status bars, nav bars)
"""

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib
import os

os.makedirs("models", exist_ok=True)

# ── Synthetic training data 
# Real training would use labeled image datasets.
# Features: [aspect_ratio, color_variance, edge_density, uniform_ratio, brightness_std]
#
# Screenshots (label=1): high edge density, low color variance, rigid aspect ratios
# Non-screenshots (label=0): high color variance, organic edges, varied ratios

np.random.seed(42)

def make_screenshot_features(n=500):
    """Simulate screenshot-like image features."""
    aspect      = np.random.choice([0.5, 1.0, 2.0, 2.16, 1.78], n)          # common phone ratios
    color_var   = np.random.uniform(0.01, 0.15, n)                            # low — UI colors
    edge_dens   = np.random.uniform(0.25, 0.60, n)                            # high — UI edges
    uniform     = np.random.uniform(0.30, 0.70, n)                            # status/nav bars
    bright_std  = np.random.uniform(20,   60,   n)                            # controlled lighting
    return np.column_stack([aspect, color_var, edge_dens, uniform, bright_std])

def make_photo_features(n=500):
    """Simulate natural photo features."""
    aspect      = np.random.uniform(0.5, 2.5, n)
    color_var   = np.random.uniform(0.15, 0.80, n)                            # high — natural scenes
    edge_dens   = np.random.uniform(0.05, 0.30, n)                            # low — organic
    uniform     = np.random.uniform(0.0,  0.20, n)
    bright_std  = np.random.uniform(40,  120,   n)
    return np.column_stack([aspect, color_var, edge_dens, uniform, bright_std])

X = np.vstack([make_screenshot_features(), make_photo_features()])
y = np.array([1] * 500 + [0] * 500)

# Shuffle
idx = np.random.permutation(len(X))
X, y = X[idx], y[idx]

# Train
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("clf",    GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)),
])
pipeline.fit(X, y)

joblib.dump(pipeline, "models/screenshot_classifier.joblib")
print("✅ Model trained and saved to models/screenshot_classifier.joblib")
print(f"   Training accuracy: {pipeline.score(X, y):.3f}")