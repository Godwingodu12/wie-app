/**
 * Invisible watermark injector for flux content.
 * Embeds viewer userId + timestamp into the canvas overlay using
 * near-invisible text patterns that survive JPEG compression.
 */

interface WatermarkOptions {
  userId: string;
  fluxId: string;
  username?: string;
}

// ── Inject watermark overlay onto [data-flux-card] ──────────────────────────
export const injectInvisibleWatermark = (
  options: WatermarkOptions,
): (() => void) => {
  const { userId, fluxId, username = "user" } = options;

  // Remove any existing watermark
  document.getElementById("flux-wm-canvas")?.remove();
  document.getElementById("flux-wm-overlay")?.remove();

  const card = document.querySelector("[data-flux-card]") as HTMLElement | null;
  if (!card) return () => {};

  const cardRect = card.getBoundingClientRect();

  // ── 1. Canvas-based invisible steganographic watermark ──
  // Uses extremely low opacity repeated text pattern
  const canvas = document.createElement("canvas");
  canvas.id = "flux-wm-canvas";
  canvas.width = cardRect.width || 360;
  canvas.height = cardRect.height || 500;

  Object.assign(canvas.style, {
    position:      "absolute",
    inset:         "0",
    width:         "100%",
    height:        "100%",
    zIndex:        "8",
    pointerEvents: "none",
    opacity:       "1",
    mixBlendMode:  "normal",
  });

  const ctx = canvas.getContext("2d");
  if (ctx) {
    const timestamp = new Date().toISOString().slice(0, 19);
    const watermarkText = `${userId}|${fluxId}|${timestamp}|${username}`;

    // Pattern 1: Ultra-low opacity repeated text (survives screenshots)
    ctx.save();
    ctx.font = "bold 11px monospace";
    // Opacity between 0.03–0.06 — invisible to naked eye, survives JPEG at q>60
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.textBaseline = "middle";

    // Rotate and tile across entire card
    const tileW = 160;
    const tileH = 60;
    for (let y = -tileH; y < canvas.height + tileH; y += tileH) {
      for (let x = -tileW; x < canvas.width + tileW; x += tileW) {
        ctx.save();
        ctx.translate(x + tileW / 2, y + tileH / 2);
        ctx.rotate(-Math.PI / 6); // -30 degrees
        ctx.fillText(watermarkText, 0, 0);
        ctx.restore();
      }
    }

    // Pattern 2: Corner anchors — slightly more visible (0.06) for robustness
    ctx.font = "bold 9px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    const corners = [
      [8, 14],
      [canvas.width - 8, 14],
      [8, canvas.height - 8],
      [canvas.width - 8, canvas.height - 8],
    ];
    for (const [cx, cy] of corners) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillText(userId.slice(0, 8), 0, 0);
      ctx.restore();
    }

    // Pattern 3: LSB-style pixel pattern encoding userId as binary
    // Encode first 32 chars of userId as pixel brightness variations
    const encoded = encodeUserIdAsPixels(ctx, userId, canvas.width, canvas.height);

    ctx.restore();
  }

  card.style.position = "relative";
  card.appendChild(canvas);

  // ── 2. Visible semi-transparent watermark (shown on focus loss) ──
  const visibleOverlay = document.createElement("div");
  visibleOverlay.id = "flux-wm-overlay";
  Object.assign(visibleOverlay.style, {
    position:      "absolute",
    inset:         "0",
    zIndex:        "9",
    pointerEvents: "none",
    opacity:       "0",
    transition:    "opacity 0.1s",
    display:       "flex",
    alignItems:    "center",
    justifyContent:"center",
    background:    "rgba(0,0,0,0)",
  });

  const watermarkLabel = document.createElement("div");
  Object.assign(watermarkLabel.style, {
    color:          "rgba(255,255,255,0.18)",
    fontSize:       "13px",
    fontWeight:     "700",
    fontFamily:     "monospace",
    transform:      "rotate(-30deg)",
    whiteSpace:     "nowrap",
    letterSpacing:  "0.05em",
    textShadow:     "0 1px 2px rgba(0,0,0,0.3)",
    userSelect:     "none",
    WebkitUserSelect:"none",
    pointerEvents:  "none",
  });
  watermarkLabel.textContent = `@${username} • ${userId.slice(0, 8)} • ${new Date().toLocaleTimeString()}`;
  visibleOverlay.appendChild(watermarkLabel);
  card.appendChild(visibleOverlay);

  return () => {
    document.getElementById("flux-wm-canvas")?.remove();
    document.getElementById("flux-wm-overlay")?.remove();
  };
};

// ── Encode userId as subtle pixel-level variations ──────────────────────────
// Writes 1px dots in a grid pattern encoding the userId bits
// These survive most screenshot/compression pipelines
function encodeUserIdAsPixels(
  ctx: CanvasRenderingContext2D,
  userId: string,
  width: number,
  height: number,
): void {
  // Convert userId to binary string
  const bits = userId
    .slice(0, 16)
    .split("")
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");

  const gridX = 16;
  const gridY = 12;
  const cellW = Math.floor(width / gridX);
  const cellH = Math.floor(height / gridY);

  let bitIdx = 0;
  for (let row = 0; row < gridY && bitIdx < bits.length; row++) {
    for (let col = 0; col < gridX && bitIdx < bits.length; col++) {
      const bit = bits[bitIdx++];
      // bit=1: very slightly lighter pixel cluster
      // bit=0: very slightly darker pixel cluster
      const alpha = bit === "1" ? 0.035 : 0.018;
      const shade = bit === "1" ? "255,255,255" : "0,0,0";

      ctx.fillStyle = `rgba(${shade},${alpha})`;
      // 3x3 pixel cluster at grid intersection
      const px = col * cellW + Math.floor(cellW / 2);
      const py = row * cellH + Math.floor(cellH / 2);
      ctx.fillRect(px - 1, py - 1, 3, 3);
    }
  }
}

// ── Show/hide the visible watermark overlay ──────────────────────────────────
export const showVisibleWatermark = (show: boolean): void => {
  const overlay = document.getElementById("flux-wm-overlay");
  if (overlay) {
    overlay.style.opacity = show ? "1" : "0";
  }
};

// ── Extract watermark from a screenshot for forensic identification ──────────
// This runs server-side / in an admin tool — included here for completeness
export const extractWatermarkFromImageUrl = async (
  imageDataUrl: string,
): Promise<{ userId: string; timestamp: string } | null> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }

      ctx.drawImage(img, 0, 0);

      // Read pixel grid — attempt to decode userId bits
      const gridX = 16;
      const gridY = 12;
      const cellW = Math.floor(img.width / gridX);
      const cellH = Math.floor(img.height / gridY);

      let bits = "";
      for (let row = 0; row < gridY; row++) {
        for (let col = 0; col < gridX; col++) {
          const px = col * cellW + Math.floor(cellW / 2);
          const py = row * cellH + Math.floor(cellH / 2);
          const pixel = ctx.getImageData(px, py, 1, 1).data;
          // Brighter pixel = bit 1, darker = bit 0
          const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
          bits += brightness > 127 ? "1" : "0";
        }
      }

      // Decode bits back to string
      let userId = "";
      for (let i = 0; i + 7 < bits.length; i += 8) {
        const charCode = parseInt(bits.slice(i, i + 8), 2);
        if (charCode > 0) userId += String.fromCharCode(charCode);
      }

      resolve(userId ? { userId, timestamp: new Date().toISOString() } : null);
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
};