import { useQuery } from "@tanstack/react-query";
import { checkAnyExistingLicense } from "@/services/supabaseCollum/reactionContract";

export const useAnyExistingLicense = (
  userId: string | undefined,
  creatorId: string | undefined,
) => {
  return useQuery({
    queryKey: ["anyExistingLicense", userId, creatorId],
    queryFn: async () => {
      if (!userId || !creatorId) return false;
      return await checkAnyExistingLicense(userId, creatorId);
    },
    enabled: !!userId && !!creatorId,
  });
};
