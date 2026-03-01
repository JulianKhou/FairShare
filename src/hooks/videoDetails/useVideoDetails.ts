import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVideoFromSupabaseById,
  licenseVideo,
} from "../../services/supabaseCollum/database";

interface Video {
  id: string;
  islicensed: boolean;
  [key: string]: any;
}

export const useVideoDetails = (video: Video) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["videoDetails", video.id],
    queryFn: async () => {
      const data = await getVideoFromSupabaseById(video.id);
      if (data && data.length > 0) {
        return data[0];
      }
      return video;
    },
    initialData: video,
  });

  const toggleMutation = useMutation({
    mutationFn: async (license: boolean) => {
      await licenseVideo(video.id, license);
      return license;
    },
    onSuccess: (license) => {
      queryClient.setQueryData(["videoDetails", video.id], (old: any) => ({
        ...old,
        islicensed: license,
      }));
      // Also invalidate video lists
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  return {
    isLicensed: query.data.islicensed,
    toggleLicense: () => toggleMutation.mutate(!query.data.islicensed),
    isLoading: toggleMutation.isPending || query.isLoading,
  };
};
