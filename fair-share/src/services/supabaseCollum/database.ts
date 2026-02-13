import { supabase } from "./client";
import { parseISO8601Duration } from "../../lib/utils";

/**
 * Speichert oder aktualisiert YouTube-Videos in der Supabase-Datenbank.
 * Nutzt 'id' (YouTube-ID) als Primary Key für den Upsert.
 */
export const saveVideosToSupabase = async (userId: string, videos: any[]) => {
  if (!videos || videos.length === 0) return;
  try {
    const rowsToInsert = videos.map((video) => ({
      id: video.id, // Primary Key (YouTube ID)
      creator_id: userId, // Verknüpfung zum User
      title: video.snippet?.title || video.title, // Fallback falls API structure varies
      thumbnail: video.snippet?.thumbnails?.high?.url || video.thumbnail,
      published_at: video.snippet?.publishedAt || video.publishedAt,

      // Metriken & Statistiken (Strings zu Zahlen konvertieren)
      view_count_at_listing: parseInt(
        video.statistics?.viewCount || video.viewCount || "0",
      ),
      last_view_count: parseInt(
        video.statistics?.viewCount || video.viewCount || "0",
      ),
      last_view_count_update: new Date().toISOString(),

      // Kategorien & Dauer
      category_id: video.snippet?.categoryId || video.categoryId ||
        video.category_id,
      duration_seconds: video.duration_seconds || 0,
      channel_title: video.snippet?.channelTitle || video.channel_title ||
        "Unknown Channel",

      // Algorithmus-Startwerte
      estimated_cpm: 0,
      final_price: 0,
      // islicensed: false,  <-- REMOVED to prevent overwriting existing status. Relies on DB default.
    }));

    const { error } = await supabase.from("videos").upsert(rowsToInsert, {
      onConflict: "id", // Verhindert Dubletten, aktualisiert bestehende
    });

    if (error) {
      console.error("Datenbank-Fehler beim Upsert:", error.message);
      throw error;
    }
  } catch (error) {
    console.error("Fehler beim Speichern der Videos:", error);
  }
};

export const getVideosFromSupabase = async (
  userId: string,
  videoType: "licensed" | "myVideos" | "licensedByMe",
) => {
  console.log(
    `Fetching videos from Supabase for user: ${userId}, type: ${videoType}`,
  );
  let query = supabase.from("videos").select("*");

  if (videoType === "myVideos") {
    query = query.eq("creator_id", userId);
  } else if (videoType === "licensed") {
    query = query.eq("islicensed", true);
    // Exclude own videos if user is logged in
    if (userId) {
      console.log(
        `Applying filter using userId: ${userId} to exclude own videos`,
      );
      query = query.neq("creator_id", userId);
    } else {
      console.log(
        "No userId provided, showing all licensed videos (including own if any)",
      );
    }
  } else if (videoType === "licensedByMe") {
    query = query.eq("creator_id", userId).eq("islicensed", true);
  }

  const { data, error } = await query;

  if (!error) {
    console.log(
      `Query Result for ${videoType}: Found ${data?.length || 0} videos.`,
    );
  }

  if (error) throw error;
  return data;
};

export const updateVideoStatistics = async (
  videoId: string,
  viewCount: number,
) => {
  console.log("Updating video statistics for video:", videoId);
  console.log("Statistics:", viewCount);
  const { error } = await supabase
    .from("videos")
    .update({
      last_view_count: viewCount,
      last_view_count_update: new Date().toISOString(),
    })
    .eq("id", videoId);

  if (error) throw error;
};

export const deleteVideoFromSupabase = async (videoId: string) => {
  console.log("Deleting video from Supabase for video:", videoId);
  const { error } = await supabase.from("videos").delete().eq("id", videoId);

  if (error) throw error;
};

export const licenseVideo = async (videoId: string, license: boolean) => {
  console.log("Licensing video from Supabase for video:", videoId);
  const { error } = await supabase
    .from("videos")
    .update({
      islicensed: license,
    })
    .eq("id", videoId);
  console.log("Video licensed:", videoId, "to", license);
  if (error) throw error;
};

export const getVideoFromSupabaseById = async (videoId: string) => {
  console.log("Fetching video from Supabase for video:", videoId);
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", videoId);

  if (error) throw error;
  return data;
};

export const getLicensedVideosFromSupabase = async () => {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("islicensed", true);

  if (error) throw error;
  return data;
};
