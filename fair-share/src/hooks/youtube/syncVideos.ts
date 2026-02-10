import { useState } from 'react';
import { fetchAllVideos } from '../../services/youtube';
import { saveVideosToSupabase } from '../../services/supabaseCollum/database';
import { useAuth } from '../auth/useAuth';

export const useSyncVideos = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const sync = async () => {
    console.log("Syncing videos for user:", user?.id);
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching videos from YouTube...");
      // 1. Daten von YouTube holen (Service 1)
      const videos = await fetchAllVideos();
      console.log("Videos fetched from YouTube:", videos);
      // 2. Daten in Supabase speichern (Service 2)
      await saveVideosToSupabase(user.id, videos);

    
      
      return videos;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { sync, loading, error };
};