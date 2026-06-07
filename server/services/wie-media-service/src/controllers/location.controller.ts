import { Request, Response } from 'express';
import { searchPlaces, getPlaceDetails } from '../config/googleMaps';
import redisClient from '../config/redis';

// ── Search / Autocomplete ─────────────────────────────────────────────────────
export const locationSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string)?.trim();
    if (!query || query.length < 2) {
      res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
      return;
    }

    const cacheKey = `location:search:${query.toLowerCase()}`;
    const cached   = await redisClient.get(cacheKey).catch(() => null);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached), source: 'cache' });
      return;
    }

    const sessionToken = (req.query.session as string) || undefined;
    const results      = await searchPlaces(query, sessionToken);

    // Cache for 10 minutes
    await redisClient.set(cacheKey, JSON.stringify(results), 600).catch(() => {});
    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Location search error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Place Details ─────────────────────────────────────────────────────────────
export const locationDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { placeId } = req.params;
    if (!placeId) {
      res.status(400).json({ success: false, message: 'placeId is required' });
      return;
    }

    const cacheKey = `location:details:${placeId}`;
    const cached   = await redisClient.get(cacheKey).catch(() => null);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached), source: 'cache' });
      return;
    }

    const details = await getPlaceDetails(placeId);

    // Cache for 24 hours — place details rarely change
    await redisClient.set(cacheKey, JSON.stringify(details), 86400).catch(() => {});
    res.json({ success: true, data: details });
  } catch (error: any) {
    console.error('Location details error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};