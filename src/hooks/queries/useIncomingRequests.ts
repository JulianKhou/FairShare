import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseCollum/client";
import { ReactionContract } from "@/services/supabaseCollum/reactionContract";

interface RequestsData {
  requests: ReactionContract[];
  licenseeNames: Record<string, string>;
}

export const useIncomingRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["incomingRequests", userId],
    queryFn: async (): Promise<RequestsData> => {
      if (!userId) return { requests: [], licenseeNames: {} };

      const { data, error } = await supabase
        .from("reaction_contracts")
        .select("*")
        .eq("licensor_id", userId)
        .eq("accepted_by_licensor", false)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

      if (error || !data) {
        return { requests: [], licenseeNames: {} };
      }

      const ids = [...new Set(data.map((c) => c.licensee_id))];
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

      return { requests: data as ReactionContract[], licenseeNames: nameMap };
    },
    enabled: !!userId,
  });
};
