/**
 * Screenshot Detection Service client for chat-service.
 * Mirrors the TypeScript client in wie-media-service but for the chat context.
 */

const BASE_URL        = process.env.SCREENSHOT_SERVICE_URL ?? "http://localhost:8003";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET        ?? "wie-internal-secret-2024";

const baseHeaders = {
  "x-internal-secret": INTERNAL_SECRET,
};

/**
 * Classify a base64 image buffer to determine if it is a screenshot.
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @returns {Promise<{ is_screenshot: boolean, confidence: number, label: string }>}
 */
export const classifyImage = async (imageBuffer, mimeType = "image/png") => {
  const form = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType });
  form.append("file", blob, "capture.png");

  const res = await fetch(`${BASE_URL}/classify`, {
    method:  "POST",
    headers: baseHeaders,
    body:    form,
  });

  if (!res.ok) throw new Error(`classify failed: ${res.status}`);
  return res.json();
};

/**
 * Report a confirmed chat screenshot event to the ML service.
 * Uses context="chat" so the Redis channel is isolated from flux events.
 *
 * @param {{ chatId: string, viewerId: string, ownerId: string, platform?: string, confidence?: number }} payload
 */
export const reportChatScreenshotEvent = async (payload) => {
  const res = await fetch(`${BASE_URL}/report-event`, {
    method:  "POST",
    headers: { ...baseHeaders, "Content-Type": "application/json" },
    body:    JSON.stringify({
      context:    "chat",
      contextId:  payload.chatId,
      viewerId:   payload.viewerId,
      ownerId:    payload.ownerId,
      platform:   payload.platform  ?? "web",
      confidence: payload.confidence ?? 1.0,
    }),
  });

  if (!res.ok) throw new Error(`report-event failed: ${res.status}`);
};

/**
 * Get screenshot analytics for a chat.
 * @param {string} chatId
 */
export const getChatScreenshotAnalytics = async (chatId) => {
  const res = await fetch(`${BASE_URL}/analytics/chat/${chatId}`, {
    headers: baseHeaders,
  });

  if (!res.ok) throw new Error(`analytics failed: ${res.status}`);
  return res.json();
};