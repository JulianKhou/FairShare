import { useQuery } from "@tanstack/react-query";
import { getContractsForVideo } from "@/services/supabaseCollum/reactionContract";
import type { ReactionContract } from "@/services/supabaseCollum/reactionContract";

export const useContractsForVideo = (
  videoId: string | undefined,
  isOpen: boolean,
) => {
  return useQuery({
    queryKey: ["contractsForVideo", videoId],
    queryFn: async (): Promise<ReactionContract[]> => {
      if (!videoId) return [];
      const data = await getContractsForVideo(videoId);
      return (data as ReactionContract[]) || [];
    },
    enabled: !!videoId && isOpen,
  });
};
