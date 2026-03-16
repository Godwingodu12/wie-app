import { Response }                  from 'express';
import { AuthRequest }               from '../middlewares/auth';
import { itunesSearch, itunesTrending, formatItunesTrack } from '../config/itunes';
import redisClient from '../config/redis';

const buildErrorResponse = (error: any) => ({
  success: false,
  message: error?.message ?? 'Unknown error',
});

// ── Search ────────────────────────────────────────────────────────────────────
export const searchMusic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string)?.trim();
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    if (!query) {
      res.status(400).json({ success: false, message: 'Query is required' });
      return;
    }

    const cacheKey = `music:search:${query.toLowerCase()}:${limit}`;
    const cached   = await redisClient.get(cacheKey).catch(() => null);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached), source: 'cache' });
      return;
    }

    const tracks = await itunesSearch(query, limit);
    console.log(`✅ Search "${query}": ${tracks.length} tracks, ${tracks.filter((t: any) => t.previewUrl).length} with preview`);

    await redisClient.set(cacheKey, JSON.stringify(tracks), 300).catch(() => {});
    res.json({ success: true, data: tracks });
  } catch (error: any) {
    console.error('Music search error:', error.message);
    res.status(500).json(buildErrorResponse(error));
  }
};

// ── Trending ──────────────────────────────────────────────────────────────────
export const getTrending = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = 'music:trending';
    const cached   = await redisClient.get(cacheKey).catch(() => null);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached), source: 'cache' });
      return;
    }

    const tracks = await itunesTrending(20);
    console.log(`✅ Trending: ${tracks.length} tracks, ${tracks.filter((t: any) => t.previewUrl).length} with preview`);

    await redisClient.set(cacheKey, JSON.stringify(tracks), 1800).catch(() => {});
    res.json({ success: true, data: tracks });
  } catch (error: any) {
    console.error('Trending error:', error.message);
    res.status(500).json(buildErrorResponse(error));
  }
};

export const getTrack = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { trackId } = req.params;
    const r           = await fetch(
      `https://itunes.apple.com/lookup?id=${trackId}&entity=song`,
      { headers: { 'User-Agent': 'wie-media-service/1.0' } }
    );

    const data = await r.json() as { results?: any[] };
    const track = (data.results ?? []).find((t: any) => t.wrapperType === 'track');

    if (!track) {
      res.status(404).json({ success: false, message: 'Track not found' });
      return;
    }

    res.json({ success: true, data: formatItunesTrack(track) });
  } catch (error: any) {
    console.error('Get track error:', error.message);
    res.status(500).json(buildErrorResponse(error));
  }
};