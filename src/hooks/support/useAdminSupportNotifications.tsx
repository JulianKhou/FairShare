import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseCollum/client";
import { toast } from "sonner";
import { MailOpen } from "lucide-react";

const ADMIN_STORAGE_KEY = "admin_support_last_seen";

/**
 * For admin: counts open tickets created since the admin last visited the
 * support page. Also fires a toast when a new ticket arrives in realtime.
 */
export function useAdminSupportNotifications(isSupportPageActive: boolean) {
  const [newTicketCount, setNewTicketCount] = useState(0);

  const getLastSeen = (): string => {
    return localStorage.getItem(ADMIN_STORAGE_KEY) ?? new Date(0).toISOString();
  };

  const markAsSeen = () => {
    const now = new Date().toISOString();
    localStorage.setItem(ADMIN_STORAGE_KEY, now);
    setNewTicketCount(0);
  };

  const fetchNewTickets = async () => {
    const lastSeen = getLastSeen();
    const { count, error } = await supabase
      .from("help_requests")
      .select("id", { count: "exact", head: true })
      .gt("created_at", lastSeen);

    if (!error) {
      setNewTicketCount(count ?? 0);
    }
  };

  useEffect(() => {
    fetchNewTickets();
  }, []);

  // Mark as seen when admin navigates to the support page
  useEffect(() => {
    if (isSupportPageActive) {
      markAsSeen();
    }
  }, [isSupportPageActive]);

  // Realtime: new ticket toast + badge increment
  useEffect(() => {
    const channel = supabase
      .channel("admin-new-ticket-notifications")
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
          setNewTicketCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { newTicketCount, markAsSeen };
}
