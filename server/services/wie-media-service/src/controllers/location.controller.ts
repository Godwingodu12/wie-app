import { Request, Response } from "express";
import { searchPlaces, getPlaceDetails } from "../config/googleMaps";
import redisClient from "../config/redis";

// ── Search / Autocomplete ─────────────────────────────────────────────────────
export const locationSearch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = (req.query.q as string)?.trim();
    if (!query || query.length < 2) {
      res
        .status(400)
        .json({
          success: false,
          message: "Query must be at least 2 characters",
        });
      return;
    }

    const cacheKey = `location:search:${query.toLowerCase()}`;
    const cached = await redisClient.get(cacheKey).catch(() => null);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached), source: "cache" });
      return;
    }

    const sessionToken = (req.query.session as string) || undefined;
    const results = await searchPlaces(query, sessionToken);

    // Cache for 10 minutes
    await redisClient
      .set(cacheKey, JSON.stringify(results), 600)
      .catch(() => {});
    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Location search error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Place Details ─────────────────────────────────────────────────────────────
export const locationDetails = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { placeId } = req.params;
    if (!placeId) {
      res.status(400).json({ success: false, message: "placeId is required" });
      return;
    }

    const cacheKey = `location:details:${placeId}`;
    const cached = await redisClient.get(cacheKey).catch(() => null);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached), source: "cache" });
      return;
    }

    const details = await getPlaceDetails(placeId);

    // Cache for 24 hours — place details rarely change
    await redisClient
      .set(cacheKey, JSON.stringify(details), 86400)
      .catch(() => {});
    res.json({ success: true, data: details });
  } catch (error: any) {
    console.error("Location details error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Reverse Geocode ───────────────────────────────────────────────────────────
export const locationReverse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      res
        .status(400)
        .json({ success: false, message: "lat and lng are required numbers" });
      return;
    }

    const cacheKey = `location:reverse:${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = await redisClient.get(cacheKey).catch(() => null);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached), source: "cache" });
      return;
    }

    const { reverseGeocode } = await import("../config/googleMaps");
    const data = await reverseGeocode(lat, lng);

    // Cache for 30 minutes — coordinates don't move
    await redisClient.set(cacheKey, JSON.stringify(data), 1800).catch(() => {});
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Reverse geocode error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
