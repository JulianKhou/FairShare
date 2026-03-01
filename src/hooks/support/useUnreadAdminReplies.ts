import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseCollum/client";

const STORAGE_KEY = "support_last_seen";

export function useUnreadAdminReplies(isModalOpen: boolean) {
  const queryClient = useQueryClient();

  const getLastSeen = (): string => {
    return localStorage.getItem(STORAGE_KEY) ?? new Date(0).toISOString();
  };

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unreadAdminReplies"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return 0;

      const lastSeen = getLastSeen();

      // Get count of admin replies on user's help requests since last seen
      const { count, error } = await supabase
        .from("help_request_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_role", "admin")
        .gt("created_at", lastSeen)
        .in(
          "help_request_id",
          (
            await supabase
              .from("help_requests")
              .select("id")
              .eq("user_id", userData.user.id)
          ).data?.map((r) => r.id) ?? [],
        );

      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30000, // Poll every 30s as fallback
  });

  const markAsSeen = () => {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, now);
    queryClient.setQueryData(["unreadAdminReplies"], 0);
  };

  // Mark as seen when modal opens
  useEffect(() => {
    if (isModalOpen) {
      markAsSeen();
    }
  }, [isModalOpen]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("user-unread-replies")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "help_request_messages" },
        (payload) => {
          if (payload.new?.sender_role === "admin" && !isModalOpen) {
            queryClient.invalidateQueries({ queryKey: ["unreadAdminReplies"] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isModalOpen, queryClient]);

  return { unreadCount, markAsSeen };
}
