import { useQuery } from "@tanstack/react-query";
import {
  getUserHelpRequests,
  HelpRequest,
} from "@/services/supabaseCollum/helpRequests";

export const useUserHelpRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["userHelpRequests", userId],
    queryFn: async (): Promise<HelpRequest[]> => {
      const data = await getUserHelpRequests();
      return data || [];
    },
    enabled: !!userId,
  });
};
