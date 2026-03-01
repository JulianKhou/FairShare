import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseCollum/client";
import { ReactionContract } from "@/services/supabaseCollum/reactionContract";

export const usePaymentDue = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["paymentDue", userId],
    queryFn: async (): Promise<ReactionContract[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("reaction_contracts")
        .select("*")
        .eq("licensee_id", userId)
        .eq("accepted_by_licensor", true)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

      if (error || !data) {
        return [];
      }

      return data as ReactionContract[];
    },
    enabled: !!userId,
  });
};
