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
      islicensed: false,
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
  videoType: "all" | "licensed" | "myVideos" = "myVideos",
) => {
  console.log(
    `Fetching videos from Supabase for user: ${userId}, type: ${videoType}`,
  );
  let query = supabase.from("videos").select("*");

  if (videoType === "myVideos") {
    // Zeige nur Videos, die diesem User gehören
    query = query.eq("creator_id", userId);
  } else if (videoType === "licensed") {
    // Zeige nur lizenzierten Videos (vom aktuellen User oder allgemein?
    // Hier gehe ich davon aus: Lizenziert VOM User)
    query = query.eq("creator_id", userId).eq("islicensed", true);
  } else if (videoType === "all") {
    // "Explore": Zeige alle lizenzierten Videos, die NICHT mir gehören
    query = query.neq("creator_id", userId).eq("islicensed", true);
  }
  // Bei "all" keinen Filter anwenden (zeigt alle Videos) -> VERALTET, jetzt angepasst

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
