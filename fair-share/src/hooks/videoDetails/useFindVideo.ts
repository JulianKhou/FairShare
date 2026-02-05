import { useState } from "react";
import { getIDsFromLink } from "@/lib/getIDsFromLinkt";
import { getLicensedVideosFromSupabase } from "@/services/supabase/database";
export const useFindVideo = () => {
  const [video, setVideo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findVideo = async (videoUrl: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Video URL:", getIDsFromLink({ videoUrl }));
      const { videoId } = getIDsFromLink({ videoUrl });
      console.log("Extracted Video ID:", videoId);

      const videos = await getLicensedVideosFromSupabase();

      for (const video of videos) {
        if (video.id === videoId) {
          setVideo(video);
          console.log("Found video:", video);
          break;
        } else {
          // Optional: clear video if not found or set specific error
          setVideo(null);
        }
      }
    } catch (error) {
      setError(error as string);
    } finally {
      setIsLoading(false);
    }
  };
  return { video, isLoading, error, findVideo };
};
