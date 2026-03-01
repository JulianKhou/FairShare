import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseCollum/client";
import type { ReactionContract } from "@/services/supabaseCollum/reactionContract";

export const useOpenInvoices = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["openInvoices", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("reaction_contracts")
        .select("*")
        .eq("licensee_id", userId)
        .eq("accepted_by_licensor", true)
        .eq("status", "PENDING")
        .is("stripe_subscription_id", null)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data as ReactionContract[]) || [];
    },
    enabled: !!userId,
  });
};
