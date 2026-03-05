import { supabase } from './supabaseCollum/client';
import { parseISO8601Duration } from '../lib/utils';

export const fetchChannelData = async (): Promise<{ id: string; subscriberCount: number; title: string; avatar: string } | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.provider_token;

  if (!token) {
    console.warn("fetchChannelData: Kein Google Provider Token in der Session gefunden. Bitte neu einloggen.");
    return null;
  }

  try {
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=id,statistics,snippet&mine=true',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!channelRes.ok) {
      console.error("Error fetching channel data:", channelRes.status, channelRes.statusText);
      return null;
    }

    const channelData = await channelRes.json();
    const item = channelData.items?.[0];

    if (item) {
      return {
        id: item.id,
        subscriberCount: parseInt(item.statistics?.subscriberCount || "0", 10),
        title: item.snippet?.title || "",
        avatar: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "",
      };
    }
    return null;
  } catch (e) {
    console.error("Error fetching channel data:", e);
    return null;
  }
};

export const fetchAllVideos = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.provider_token;

  if (!token) throw new Error("Kein Access-Token vorhanden.");

  // 1) Uploads-Playlist ID holen
  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!channelRes.ok) {
    throw new Error(`YouTube channels API Fehler: ${channelRes.status} ${channelRes.statusText}`);
  }

  const channelData = await channelRes.json();
  const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsId) {
    throw new Error("Uploads-Playlist konnte nicht ermittelt werden.");
  }

  // 2) Alle Videos aus der Uploads-Playlist mit Pagination holen
  const playlistItems: any[] = [];
  let nextPageToken: string | undefined;

  do {
    const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    playlistUrl.searchParams.set('part', 'snippet,status');
    playlistUrl.searchParams.set('playlistId', uploadsId);
    playlistUrl.searchParams.set('maxResults', '50');
    if (nextPageToken) {
      playlistUrl.searchParams.set('pageToken', nextPageToken);
    }

    const videosRes = await fetch(playlistUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!videosRes.ok) {
      throw new Error(`YouTube playlistItems API Fehler: ${videosRes.status} ${videosRes.statusText}`);
    }

    const videosData = await videosRes.json();
    playlistItems.push(...(videosData.items || []));
    nextPageToken = videosData.nextPageToken;
  } while (nextPageToken);

  const videoIds = playlistItems
    .map((v: any) => v?.snippet?.resourceId?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) {
    return [];
  }

  // 3) Details + Statistik in 50er-Batches laden
  const allVideoDetails: any[] = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const batchIds = videoIds.slice(i, i + 50).join(',');
    const statisticsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${batchIds}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!statisticsRes.ok) {
      throw new Error(`YouTube videos API Fehler: ${statisticsRes.status} ${statisticsRes.statusText}`);
    }

    const statisticsData = await statisticsRes.json();
    allVideoDetails.push(...(statisticsData.items || []));
  }

  return allVideoDetails.map((item: any) => ({
    id: item.id,
    creator_id: item.snippet.channelId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.high?.url,
    publishedAt: item.snippet.publishedAt,
    viewCount: item.statistics.viewCount,
    categoryId: item.snippet.categoryId,
    duration_seconds: parseISO8601Duration(item.contentDetails.duration),
    channel_title: item.snippet.channelTitle,
    privacyStatus: item.status?.privacyStatus || "unknown",
  }));
};
