// src/hooks/youtube/useVideos.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/useAuth";
import { getVideosFromSupabase } from "../../services/supabaseCollum/database";
import { useSyncVideos } from "./syncVideos";

import { supabase } from "../../services/supabaseCollum/client";

export function useVideos(
  videoType: "licensed" | "licensedByMe" | "myVideos",
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

    // Safety check: Cannot fetch user-specific videos without a user ID
    if (!targetUserId && videoType !== "licensed") {
      return;
    }

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
    // Wir brechen hier NICHT mehr ab, damit auch "licensed" (Public) funktioniert.
    // Aber wir müssen sicherstellen, dass wir für user-spezifische Dinge eine ID haben.

    let channel = supabase.channel(`video-updates-${videoType}-${user?.id || 'public'}`);
    let isSubscribed = false;

    if (videoType === "myVideos" && user?.id) {
      console.log(
        "Setting up Realtime subscription for myVideos (User:",
        user.id,
        ")",
      );
      channel = channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "videos",
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            console.log("Realtime change received!", payload);
            loadVideos();
          },
        )
        .subscribe();
      isSubscribed = true;
    } else if (videoType === "licensed") {
      console.log(
        "Setting up Realtime subscription for licensed videos (Public)",
      );
      channel = channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "videos",
            filter: `islicensed=eq.true`,
          },
          (payload: any) => {
            // Optimierung: Wenn das Event von mir selbst kommt, ignorieren wir es,
            // da meine Videos auf "Explore" ohnehin nicht angezeigt werden sollen.
            if (user?.id && payload.new && payload.new.creator_id === user.id) {
              return;
            }
            console.log("Realtime change received!", payload);
            loadVideos();
          },
        )
        .subscribe();
      isSubscribed = true;
    } else if (videoType === "licensedByMe" && user?.id) {
      console.log(
        "Setting up Realtime subscription for licensedByMe (User:",
        user.id,
        ")",
      );
      channel = channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "videos",
            filter: `creator_id=eq.${user.id}`,
          },
          (payload: any) => {
            console.log("Realtime change received!", payload);
            loadVideos();
          },
        )
        .subscribe();
      isSubscribed = true;
    }

    return () => {
      // Cleanup nur, wenn wir auch subscribed haben
      if (isSubscribed) {
        console.log("Cleaning up Realtime subscription");
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, loadVideos, videoType]);

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
