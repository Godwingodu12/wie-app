import dotenv from 'dotenv';
dotenv.config();

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

interface SpotifyTokenResponse {
  access_token: string;
  token_type:   string;
  expires_in:   number;
  error?:             string;
  error_description?: string;
}

interface SpotifyErrorResponse {
  error: {
    status:  number;
    message: string;
  };
}

const validateCredentials = (): void => {
  const id     = process.env.SPOTIFY_CLIENT_ID?.trim()     ?? '';
  const secret = process.env.SPOTIFY_CLIENT_SECRET?.trim() ?? '';
  if (!id || !secret) {
    throw new Error('SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing from .env');
  }
};

export const getSpotifyToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  validateCredentials();

  const clientId     = process.env.SPOTIFY_CLIENT_ID!.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!.trim();
  const credentials  = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  let res: Response;
  try {
    res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization:  `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
  } catch (networkErr: any) {
    throw new Error(`Network error reaching Spotify auth: ${networkErr.message}`);
  }

  const data = await res.json() as SpotifyTokenResponse;

  if (!res.ok) {
    console.error('❌ Spotify token failed:', {
      status:      res.status,
      error:       data.error,
      description: data.error_description,
    });
    throw new Error(
      `Spotify auth failed [${res.status}]: ${data.error_description ?? data.error ?? 'unknown'}`
    );
  }

  cachedToken    = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  console.log(`✅ Spotify token acquired — valid for ${data.expires_in}s`);
  return cachedToken;
};

export const spotifySearch = async (
  query:  string,
  type:   string = 'track',
  limit:  number = 10            // ← safe default, max 50
): Promise<any> => {
  const token = await getSpotifyToken();

  // ── Build URL manually — avoid URLSearchParams type coercion issues ──────────
  // Do NOT include market= in development mode — causes "Invalid limit" 400 error
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const url =
    `https://api.spotify.com/v1/search` +
    `?q=${encodeURIComponent(query)}` +
    `&type=${encodeURIComponent(type)}` +
    `&limit=${safeLimit}` +
    `&market=US`;

  console.log('🔍 Spotify search:', url);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization:  `Bearer ${token}`,
        'Accept':        'application/json',
        'Content-Type':  'application/json',
      },
    });
  } catch (networkErr: any) {
    throw new Error(`Network error reaching Spotify search: ${networkErr.message}`);
  }

  const rawText = await res.text();
  console.log('📡 Spotify search status:', res.status);

  if (!res.ok) {
    console.error('❌ Spotify search error body:', rawText);

    if (res.status === 401) {
      cachedToken    = null;
      tokenExpiresAt = 0;
      console.warn('⚠️  Token invalidated — will re-fetch on next request');
    }

    let parsed: any = {};
    try { parsed = JSON.parse(rawText); } catch { /* ignore */ }

    throw new Error(
      `Spotify search failed [${res.status}]: ${parsed?.error?.message ?? rawText}`
    );
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error('Failed to parse Spotify search response');
  }
};