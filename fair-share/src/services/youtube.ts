import { supabase } from './supabaseCollum/client';
import { parseISO8601Duration } from '../lib/utils';


export const fetchChannelData = async (): Promise<{ id: string; subscriberCount: number } | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.provider_token;

  if (!token) return null; // Silent fail if no token

  try {
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=id,statistics&mine=true',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const channelData = await channelRes.json();
    const item = channelData.items?.[0];
    
    if (item) {
        return {
            id: item.id,
            subscriberCount: parseInt(item.statistics?.subscriberCount || "0", 10)
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
  ;

  if (!token) throw new Error("Kein Access-Token vorhanden.");

  // 1. Hole die 'Uploads'-Playlist ID des Kanals
  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const channelData = await channelRes.json();

  const uploadsId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

  // 2. Hole die Videos aus dieser Playlist
  const videosRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,status&playlistId=${uploadsId}&maxResults=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const videosData = await videosRes.json();
  const videoIds = videosData.items.map((v: any) => v.snippet.resourceId.videoId);
  const statisticsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoIds}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const statisticsData = await statisticsRes.json();

  console.log("Videos fetched from YouTube:", statisticsData);


  return statisticsData.items.map((item: any) => ({
    id: item.id,
    creator_id: item.snippet.channelId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.high?.url,
    publishedAt: item.snippet.publishedAt,
    viewCount: item.statistics.viewCount,         // Aus den statistics
    categoryId: item.snippet.categoryId,
    duration_seconds: parseISO8601Duration(item.contentDetails.duration),
    channel_title: item.snippet.channelTitle,
    privacyStatus: item.status?.privacyStatus || "unknown",
  }));
};