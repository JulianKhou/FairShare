import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseCollum/client";
import { ReactionContract } from "@/services/supabaseCollum/reactionContract";

interface CreatorContractsData {
  contracts: ReactionContract[];
  licenseeNames: Record<string, string>;
  contractRevenues: Record<string, number>;
}

export const useCreatorContracts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["creatorContracts", userId],
    queryFn: async (): Promise<CreatorContractsData> => {
      if (!userId) {
        return { contracts: [], licenseeNames: {}, contractRevenues: {} };
      }

      const { data: contractsData, error } = await supabase
        .from("reaction_contracts")
        .select("*")
        .eq("licensor_id", userId)
        .order("created_at", { ascending: false });

      if (error || !contractsData) {
        return { contracts: [], licenseeNames: {}, contractRevenues: {} };
      }

      const contracts = contractsData as ReactionContract[];

      // Fetch licensee names
      const ids = [...new Set(contracts.map((c) => c.licensee_id))];
      const nameMap: Record<string, string> = {};

      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ids);
        if (profiles) {
          profiles.forEach((p) => {
            nameMap[p.id] = p.full_name || "Unbekannt";
          });
        }
      }

      // Fetch actual accumulated revenue per contract
      const revMap: Record<string, number> = {};
      const { data: revenues } = await supabase
        .from("revenue_events")
        .select("contract_id, amount_cents")
        .eq("licensor_id", userId);

      if (revenues) {
        revenues.forEach((r) => {
          if (!revMap[r.contract_id]) revMap[r.contract_id] = 0;
          revMap[r.contract_id] += r.amount_cents / 100;
        });
      }

      return {
        contracts,
        licenseeNames: nameMap,
        contractRevenues: revMap,
      };
    },
    enabled: !!userId,
  });
};
