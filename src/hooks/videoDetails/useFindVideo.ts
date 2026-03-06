import { useState } from "react";
import { getIDsFromLink } from "@/lib/getIDsFromLinkt";
import { getVideoFromSupabaseById } from "@/services/supabaseCollum/database";

export const useFindVideo = () => {
  const [video, setVideo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findVideo = async (videoUrl: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { videoId } = getIDsFromLink({ videoUrl });
      if (!videoId) {
        setVideo(null);
        setError("Ung\u00fcltiger YouTube-Link.");
        return;
      }

      const data = await getVideoFromSupabaseById(videoId);
      const found = data?.[0];

      if (found?.islicensed) {
        setVideo(found);
      } else {
        setVideo(null);
      }
    } catch {
      setError("Fehler bei der Videosuche.");
      setVideo(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { video, isLoading, error, findVideo };
};
