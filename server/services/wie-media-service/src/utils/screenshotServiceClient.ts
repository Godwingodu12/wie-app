const BASE_URL        = process.env.SCREENSHOT_SERVICE_URL ?? "http://localhost:8003";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET        ?? "wie-internal-secret-2024";

const baseHeaders: Record<string, string> = {
  "x-internal-secret": INTERNAL_SECRET,
};

/**
 * Classify a canvas capture to determine if it is a screenshot.
 */
export const classifyImage = async (
  imageBuffer: Buffer,
  mimeType = "image/png",
): Promise<{ is_screenshot: boolean; confidence: number; label: string }> => {
  const form = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType });
  form.append("file", blob, "capture.png");

  const res = await fetch(`${BASE_URL}/classify`, {
    method:  "POST",
    headers: baseHeaders,
    body:    form,
  });

  if (!res.ok) throw new Error(`classify failed: ${res.status}`);
  return res.json() as Promise<{ is_screenshot: boolean; confidence: number; label: string }>;
};

/**
 * Report a confirmed screenshot event to the ML service.
 */
export const reportScreenshotEvent = async (payload: {
  fluxId:      string;
  viewerId:    string;
  ownerId:     string;
  platform?:   string;
  confidence?: number;
}): Promise<void> => {
  const res = await fetch(`${BASE_URL}/report-event`, {
    method:  "POST",
    headers: { ...baseHeaders, "Content-Type": "application/json" },
    body:    JSON.stringify({
      fluxId:     payload.fluxId,
      viewerId:   payload.viewerId,
      ownerId:    payload.ownerId,
      platform:   payload.platform  ?? "web",
      confidence: payload.confidence ?? 1.0,
    }),
  });

  if (!res.ok) throw new Error(`report-event failed: ${res.status}`);
};

/**
 * Get screenshot analytics for a flux from the ML service.
 */
export const getScreenshotAnalytics = async (
  fluxId: string,
): Promise<{ totalEvents: number; uniqueViewers: number; viewerIds: string[] }> => {
  const res = await fetch(`${BASE_URL}/analytics/${fluxId}`, {
    headers: baseHeaders,
  });

  if (!res.ok) throw new Error(`analytics failed: ${res.status}`);
  return res.json() as Promise<{ totalEvents: number; uniqueViewers: number; viewerIds: string[] }>;
};