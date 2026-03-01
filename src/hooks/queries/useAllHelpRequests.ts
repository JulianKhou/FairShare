import { useQuery } from "@tanstack/react-query";
import {
  getAllHelpRequests,
  HelpRequest,
} from "@/services/supabaseCollum/helpRequests";

export const useAllHelpRequests = () => {
  return useQuery({
    queryKey: ["allHelpRequests"],
    queryFn: async (): Promise<HelpRequest[]> => {
      const data = await getAllHelpRequests();
      return data || [];
    },
  });
};
