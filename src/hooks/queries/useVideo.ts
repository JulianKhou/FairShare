import { useQuery } from "@tanstack/react-query";
import { getVideoFromSupabaseById } from "@/services/supabaseCollum/database";

export const useVideo = (videoId: string | undefined) => {
  return useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      if (!videoId) return null;
      const data = await getVideoFromSupabaseById(videoId);
      if (!data || data.length === 0) {
        throw new Error("Video wurde nicht gefunden.");
      }
      return data[0];
    },
    enabled: !!videoId,
  });
};
