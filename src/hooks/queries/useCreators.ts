import { useQuery } from "@tanstack/react-query";
import { getLicensedVideosFromSupabase } from "@/services/supabaseCollum/database";
import { getProfilesByIds, Profile } from "@/services/supabaseCollum/profiles";

export const useCreators = () => {
  return useQuery({
    queryKey: ["creators"],
    queryFn: async (): Promise<Profile[]> => {
      // 1. Fetch all licensed videos to find active creators
      const licensedVideos = await getLicensedVideosFromSupabase();

      if (!licensedVideos || licensedVideos.length === 0) {
        return [];
      }

      // 2. Extract unique creator IDs
      const uniqueCreatorIds = Array.from(
        new Set(
          licensedVideos
            .map((video) => video.creator_id)
            .filter(Boolean) as string[],
        ),
      );

      if (uniqueCreatorIds.length === 0) {
        return [];
      }

      // 3. Fetch full profiles for these creators
      const profiles = await getProfilesByIds(uniqueCreatorIds);

      // Sort them alphabetically by name
      return profiles.sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || ""),
      );
    },
  });
};
