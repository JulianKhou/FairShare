import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { updateVideoStatistics, saveVideosToSupabase } from "../../services/supabaseCollum/database";
import { fetchAllVideos } from "../../services/youtube";
import { getProfile } from "../../services/supabaseCollum/profiles";

export const useUpdateVideos = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const updateVideos = async () => {
        console.log("Updating video stats for user:", user?.id);
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            console.log("Fetching videos from YouTube...");
            // 1. Daten von YouTube holen
            const videos = await fetchAllVideos();
            
            const profile = await getProfile(user.id);
            const autoLicense = profile?.auto_license_videos ?? false;

            // Speichern (Upsert) immer ausführen, damit auch Änderungen übernommen werden
            await saveVideosToSupabase(user.id, videos, autoLicense);
            
            // 2. Statistiken in Supabase aktualisieren
            // Wir warten auf alle Updates parallel
            const updatePromises = videos.map((video: any) => 
                updateVideoStatistics(video.id, video.viewCount)
            );
            
            await Promise.all(updatePromises);
            
            return videos;
        } catch (err: any) {
            console.error("Fehler beim Update:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { updateVideos, loading, error };
}
