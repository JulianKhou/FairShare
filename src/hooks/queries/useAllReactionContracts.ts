import { useQuery } from "@tanstack/react-query";
import {
  getAllReactionContracts,
  ReactionContract,
} from "@/services/supabaseCollum/reactionContract";

export const useAllReactionContracts = () => {
  return useQuery({
    queryKey: ["allContracts"],
    queryFn: async (): Promise<ReactionContract[]> => {
      const data = await getAllReactionContracts();
      return data || [];
    },
  });
};
