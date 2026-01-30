// src/hooks/youtube/useVideos.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/useAuth";
import { getVideosFromSupabase } from "../../services/supabase/database";
import { useSyncVideos } from "./syncVideos";
// Import fetchAllVideos because we use it as a fallback
import { fetchAllVideos } from "../../services/youtube";
import { supabase } from "../../services/supabase/client";

export function useVideos(
  videoType: "all" | "licensed" | "myVideos" = "myVideos",
  userId?: string,
) {
  const { user } = useAuth();
  const { sync: syncService, loading: isSyncing } = useSyncVideos();

  // Wir verwalten die echten Daten UND den Status
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // useCallback verhindert, dass die Funktion bei jedem Render neu erstellt wird
  const loadVideos = useCallback(async () => {
    // Wenn wir "myVideos" laden wollen, brauchen wir eine User-ID (entweder übergeben oder vom Auth)
    const targetUserId = userId || user?.id;

    // Bei "all" brauchen wir nicht zwingend eine UserID, bei anderen schon
    if (videoType !== "all" && !targetUserId) return;

    setIsLoading(true);
    try {
      // 1. Versuche Videos aus Supabase zu laden
      // Hier nutzen wir targetUserId, falls vorhanden, sonst einen leeren String (für "all" irrelevant)
      let data = await getVideosFromSupabase(targetUserId || "", videoType);

      // 2. Wenn keine Daten da sind (null oder leeres Array), versuche YouTube direkt
      if (!data || data.length === 0) {
        console.log("Keine Videos in DB, lade direkt von YouTube...");
        // fetchAllVideos() benötigt keine Argumente (nutzt intern den Auth-Token)
        syncService();
      }

      setVideos(data || []);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, userId, videoType]);

  // 1. Automatisch laden, wenn der User feststeht
  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // 2. Realtime Subscription: Hört auf Änderungen in der DB
  useEffect(() => {
    if (!user?.id) return;

    console.log("Setting up Realtime subscription for user:", user.id);

    const channel = supabase
      .channel("video-updates")
      .on(
        "postgres_changes",
        {
          event: "*", // Hört auf alle Events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "videos",
          filter: `user_id=eq.${user.id}`, // Nur Änderungen für diesen User
        },
        (payload: any) => {
          console.log("Realtime change received!", payload);
          loadVideos(); // Liste neu laden
        },
      )
      .subscribe();

    return () => {
      console.log("Cleaning up Realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadVideos]);

  // 2. Sync-Wrapper, der danach die lokale Liste aktualisiert
  const syncAndRefresh = async () => {
    await syncService(); // Holt Daten von YouTube -> Supabase
    await loadVideos(); // Holt neue Daten von Supabase -> UI
  };

  return {
    videos,
    hasVideos: videos.length > 0,
    isSyncing,
    isLoading,
    sync: syncAndRefresh,
  };
}
