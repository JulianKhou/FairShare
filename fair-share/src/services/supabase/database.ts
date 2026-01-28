import { supabase } from "./client";

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
      title: video.title,
      thumbnail: video.thumbnail,
      published_at: video.publishedAt,

      // Metriken & Statistiken (Strings zu Zahlen konvertieren)
      view_count_at_listing: parseInt(video.viewCount || "0"),
      last_view_count: parseInt(video.viewCount || "0"),
      last_view_count_update: new Date().toISOString(),

      // Kategorien & Dauer
      category_id: video.categoryId,
      duration_seconds: video.durationSeconds || 0,

      // Algorithmus-Startwerte
      estimated_cpm: 0,
      final_price: 0,
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

export const getVideosFromSupabase = async (userId: string) => {
  console.log("Fetching videos from Supabase for user:", userId);
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("creator_id", userId);

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
