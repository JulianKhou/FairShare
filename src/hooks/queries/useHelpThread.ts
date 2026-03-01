import { useQuery } from "@tanstack/react-query";
import {
  getThreadMessages,
  HelpRequestMessage,
} from "@/services/supabaseCollum/helpRequests";

export const useHelpThread = (requestId: string | undefined) => {
  return useQuery({
    queryKey: ["helpThread", requestId],
    queryFn: async (): Promise<HelpRequestMessage[]> => {
      if (!requestId) return [];
      const msgs = await getThreadMessages(requestId);
      return msgs || [];
    },
    enabled: !!requestId,
  });
};
