import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseCollum/client";
import {
  getPurchasedContracts,
  ReactionContract,
} from "@/services/supabaseCollum/reactionContract";

interface MyLicensesData {
  licenses: ReactionContract[];
  reactionTitles: Record<string, string>;
  licenseSpents: Record<string, number>;
}

export const useMyLicenses = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["myLicenses", userId],
    queryFn: async (): Promise<MyLicensesData> => {
      if (!userId) {
        return { licenses: [], reactionTitles: {}, licenseSpents: {} };
      }

      const validLicenses = (await getPurchasedContracts(userId)) || [];

      // Fetch titles for reaction videos
      const reactionIds = validLicenses
        .map((l) => l.reaction_video_id)
        .filter((id): id is string => !!id);

      const titleMap: Record<string, string> = {};
      if (reactionIds.length > 0) {
        const { data: videos } = await supabase
          .from("videos")
          .select("id, title")
          .in("id", reactionIds);

        if (videos) {
          videos.forEach((v) => (titleMap[v.id] = v.title));
        }
      }

      // Fetch actual accumulated spent per contract
      const spentMap: Record<string, number> = {};
      const { data: spents } = await supabase
        .from("revenue_events")
        .select("contract_id, amount_cents")
        .eq("licensee_id", userId);

      if (spents) {
        spents.forEach((s) => {
          if (!spentMap[s.contract_id]) spentMap[s.contract_id] = 0;
          spentMap[s.contract_id] += s.amount_cents / 100;
        });
      }

      return {
        licenses: validLicenses,
        reactionTitles: titleMap,
        licenseSpents: spentMap,
      };
    },
    enabled: !!userId,
  });
};
