import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseCollum/client";

const STORAGE_KEY = "support_last_seen";

/**
 * Returns the count of admin replies that arrived after the user last opened
 * the Help modal. Resets to 0 when the modal is opened.
 */
export function useUnreadAdminReplies(isModalOpen: boolean) {
    const [unreadCount, setUnreadCount] = useState(0);

    const getLastSeen = (): string => {
        return localStorage.getItem(STORAGE_KEY) ?? new Date(0).toISOString();
    };

    const markAsSeen = () => {
        const now = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, now);
        setUnreadCount(0);
    };

    const fetchUnread = async () => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const lastSeen = getLastSeen();

        // Count admin replies on the current user's tickets since last seen
        const { count, error } = await supabase
            .from("help_request_messages")
            .select("id", { count: "exact", head: true })
            .eq("sender_role", "admin")
            .gt("created_at", lastSeen)
            .in(
                "help_request_id",
                // subquery via RLS: user can only see their own tickets
                (
                    await supabase
                        .from("help_requests")
                        .select("id")
                        .eq("user_id", userData.user.id)
                ).data?.map((r) => r.id) ?? []
            );

        if (!error) {
            setUnreadCount(count ?? 0);
        }
    };

    useEffect(() => {
        fetchUnread();
    }, []);

    // Mark as seen when user opens the modal
    useEffect(() => {
        if (isModalOpen) {
            markAsSeen();
        }
    }, [isModalOpen]);

    // Realtime: increment badge when a new admin message arrives
    useEffect(() => {
        const channel = supabase
            .channel("user-unread-notifications")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "help_request_messages" },
                (payload) => {
                    if (payload.new?.sender_role === "admin") {
                        // Only increment if modal is currently closed
                        setUnreadCount((prev) => (prev < 99 ? prev + 1 : prev));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { unreadCount, markAsSeen };
}
