import { Response }                  from 'express';
import { AuthRequest }               from '../middlewares/auth';
import { itunesSearch, itunesTrending, formatItunesTrack } from '../config/itunes';
import redisClient from '../config/redis';
import MusicLikeModel from '../models/music-like.model';

const buildErrorResponse = (error: any) => ({
  success: false,
  message: error?.message ?? 'Unknown error',
});

// ── Search ────────────────────────────────────────────────────────────────────
export const searchMusic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = ((req.query.q || req.query.search) as string)?.trim();
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

// ── Generic getMusic (Trending or Search) ─────────────────────────────────────
export const getMusic = async (req: AuthRequest, res: Response): Promise<void> => {
  const query = ((req.query.q || req.query.search) as string)?.trim();
  if (query) {
    return searchMusic(req, res);
  }
  return getTrending(req, res);
};

// ── Liked Music ───────────────────────────────────────────────────────────────
export const toggleMusicLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { musicId } = req.params;
    const userId = req.userId!;
    const { title, artist, previewUrl, albumArt } = req.body;

    const existing = await MusicLikeModel.findOne({ musicId, userId });

    if (existing) {
      await MusicLikeModel.deleteOne({ _id: existing._id });
      res.json({ success: true, liked: false, message: 'Removed from liked music' });
    } else {
      await MusicLikeModel.create({
        musicId,
        userId,
        title,
        artist,
        previewUrl,
        albumArt
      });
      res.json({ success: true, liked: true, message: 'Added to liked music' });
    }
  } catch (error: any) {
    console.error('Toggle music like error:', error.message);
    res.status(500).json(buildErrorResponse(error));
  }
};

export const getLikedMusic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const likes = await MusicLikeModel.find({ userId }).sort({ createdAt: -1 });

    const formatted = likes.map(l => ({
      id: l.musicId,
      title: l.title,
      artist: l.artist,
      previewUrl: l.previewUrl,
      albumArt: l.albumArt,
      isLiked: true
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Get liked music error:', error.message);
    res.status(500).json(buildErrorResponse(error));
  }
};