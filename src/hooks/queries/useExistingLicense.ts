import { useQuery } from "@tanstack/react-query";
import { checkExistingLicense } from "@/services/supabaseCollum/reactionContract";

export const useExistingLicense = (
  userId: string | undefined,
  creatorId: string | undefined,
  videoId: string | undefined,
) => {
  return useQuery({
    queryKey: ["existingLicense", userId, creatorId, videoId],
    queryFn: async () => {
      if (!userId || !creatorId || !videoId) return null;
      return await checkExistingLicense(userId, creatorId, videoId);
    },
    enabled: !!userId && !!creatorId && !!videoId,
  });
};
