/**
 * In-memory cooldown tracker for like notifications.
 * Key: `${fromUserId}:${postId}`
 * Value: timestamp of last notification sent
 *
 * Prevents spam when a user rapidly likes → unlikes → likes the same post.
 * Cooldown: 30 minutes. After cooldown expires, a fresh notification is allowed.
 */

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

// Map<"userId:postId", lastNotifiedAt (ms)>
const cooldownMap = new Map<string, number>();

// Periodically prune stale entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of cooldownMap.entries()) {
    if (now - ts > COOLDOWN_MS) cooldownMap.delete(key);
  }
}, 10 * 60 * 1000); // prune every 10 minutes

/**
 * Returns true if a notification SHOULD be sent (not in cooldown).
 * Automatically records the timestamp when it returns true.
 */
export const shouldSendLikeNotif = (
  fromUserId: string,
  postId: string,
): boolean => {
  const key = `${fromUserId}:${postId}`;
  const last = cooldownMap.get(key);
  const now  = Date.now();

  if (last && now - last < COOLDOWN_MS) {
    return false; // still in cooldown
  }

  cooldownMap.set(key, now);
  return true;
};

/**
 * Call this on unlike so that if the user re-likes after unliking,
 * the cooldown is NOT reset — they must wait out the original cooldown.
 * (Do NOT delete the key on unlike — that would re-enable spam.)
 */
export const onUnlike = (_fromUserId: string, _postId: string): void => {
  // Intentionally a no-op: we keep the cooldown timestamp on unlike
  // so rapid like→unlike→like cycles don't bypass the cooldown.
};