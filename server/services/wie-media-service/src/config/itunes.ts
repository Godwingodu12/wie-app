const formatDuration = (ms: number): string => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface ItunesTrack {
  wrapperType?:    string;
  kind?:           string;
  trackId:         number;
  trackName:       string;
  artistName:      string;
  collectionName?: string;
  artworkUrl100?:  string;
  artworkUrl60?:   string;
  previewUrl?:     string | null;
  trackTimeMillis?: number;
}

interface ItunesSearchResponse {
  resultCount: number;
  results:     ItunesTrack[];
}

interface ItunesRssEntry {
  id?: { attributes?: { 'im:id'?: string } };
}

interface ItunesRssFeed {
  entry?: ItunesRssEntry[];
}

interface ItunesRssResponse {
  feed?: ItunesRssFeed;
}

export const formatItunesTrack = (t: ItunesTrack) => ({
  id:         String(t.trackId),
  title:      t.trackName       ?? 'Unknown',
  artist:     t.artistName      ?? 'Unknown',
  album:      t.collectionName  ?? '',
  albumArt:   t.artworkUrl100   ?? t.artworkUrl60 ?? null,
  previewUrl: t.previewUrl      ?? null,
  durationMs: t.trackTimeMillis ?? 0,
  duration:   formatDuration(t.trackTimeMillis ?? 0),
  spotifyUrl: null,
  popularity: 0,
});

export const itunesSearch = async (
  query: string,
  limit: number = 10
): Promise<ReturnType<typeof formatItunesTrack>[]> => {
  const url =
    `https://itunes.apple.com/search` +
    `?term=${encodeURIComponent(query)}` +
    `&media=music` +
    `&entity=song` +
    `&limit=${Math.min(limit, 50)}` +
    `&country=US`;

  console.log('🎵 iTunes search:', url);

  const res = await fetch(url, {
    headers: { 'User-Agent': 'wie-media-service/1.0' },
  });

  if (!res.ok) throw new Error(`iTunes search failed [${res.status}]`);

  const data = await res.json() as ItunesSearchResponse;

  return (data.results ?? [])
    .filter((t) => t.wrapperType === 'track' && t.kind === 'song')
    .sort((a, b) => (b.previewUrl ? 1 : 0) - (a.previewUrl ? 1 : 0))
    .map(formatItunesTrack);
};

export const itunesTrending = async (
  limit: number = 20
): Promise<ReturnType<typeof formatItunesTrack>[]> => {
  const rssUrl = `https://itunes.apple.com/us/rss/topsongs/limit=${limit}/json`;
  console.log('📈 iTunes trending:', rssUrl);

  try {
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'wie-media-service/1.0' },
    });

    if (!res.ok) return itunesSearch('top hits 2025', limit);

    const data = await res.json() as ItunesRssResponse;
    const entries: ItunesRssEntry[] = data?.feed?.entry ?? [];

    if (entries.length === 0) return itunesSearch('top hits 2025', limit);

    const ids = entries
      .slice(0, limit)
      .map((e) => e.id?.attributes?.['im:id'])
      .filter((id): id is string => Boolean(id));

    if (ids.length === 0) return itunesSearch('top hits 2025', limit);

    const lookupRes = await fetch(
      `https://itunes.apple.com/lookup?id=${ids.join(',')}&entity=song`,
      { headers: { 'User-Agent': 'wie-media-service/1.0' } }
    );

    if (!lookupRes.ok) return itunesSearch('top hits 2025', limit);

    const lookupData = await lookupRes.json() as ItunesSearchResponse;

    return (lookupData.results ?? [])
      .filter((t) => t.wrapperType === 'track')
      .sort((a, b) => (b.previewUrl ? 1 : 0) - (a.previewUrl ? 1 : 0))
      .map(formatItunesTrack);
  } catch {
    return itunesSearch('top hits 2025', limit);
  }
};