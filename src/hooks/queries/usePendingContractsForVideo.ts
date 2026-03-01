import { useQuery } from "@tanstack/react-query";
import { getPendingReactionContracts } from "@/services/supabaseCollum/reactionContract";
import type { ReactionContract } from "@/services/supabaseCollum/reactionContract";

export const usePendingContractsForVideo = (
  videoId: string | undefined,
  isOpen: boolean,
  mode: "owner" | "public" | undefined,
) => {
  return useQuery({
    queryKey: ["pendingContractsForVideo", videoId],
    queryFn: async (): Promise<ReactionContract[]> => {
      if (!videoId) return [];
      const data = await getPendingReactionContracts(videoId);
      return (data as ReactionContract[]) || [];
    },
    enabled: !!videoId && isOpen && mode === "owner",
  });
};
