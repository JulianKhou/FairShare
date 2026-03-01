import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseCollum/client";
import { toast } from "sonner";
import { MailOpen } from "lucide-react";

const ADMIN_STORAGE_KEY = "admin_support_last_seen";

export function useAdminSupportNotifications(isSupportPageActive: boolean) {
  const queryClient = useQueryClient();

  const getLastSeen = (): string => {
    return localStorage.getItem(ADMIN_STORAGE_KEY) ?? new Date(0).toISOString();
  };

  const { data: newTicketCount = 0 } = useQuery({
    queryKey: ["adminSupportNotifications"],
    queryFn: async () => {
      const lastSeen = getLastSeen();
      const { count, error } = await supabase
        .from("help_requests")
        .select("id", { count: "exact", head: true })
        .gt("created_at", lastSeen);

      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const markAsSeen = () => {
    const now = new Date().toISOString();
    localStorage.setItem(ADMIN_STORAGE_KEY, now);
    queryClient.setQueryData(["adminSupportNotifications"], 0);
  };

  useEffect(() => {
    if (isSupportPageActive) {
      markAsSeen();
    }
  }, [isSupportPageActive]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-new-tickets")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "help_requests" },
        (payload) => {
          const subject = (payload.new as any)?.subject ?? "Neues Ticket";
          toast(`Neue Support-Anfrage: „${subject}"`, {
            description: "Klicke hier, um das Ticket zu öffnen.",
            duration: 8000,
            icon: <MailOpen className="w-4 h-4" />,
          });
          queryClient.invalidateQueries({
            queryKey: ["adminSupportNotifications"],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { newTicketCount, markAsSeen };
}
