import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import {
  getVideosFromSupabase,
  saveVideosToSupabase,
  updateVideoStatistics,
} from "../../services/supabaseCollum/database";
import { fetchAllVideos } from "../../services/youtube";
import { getProfile } from "../../services/supabaseCollum/profiles";
import { supabase } from "../../services/supabaseCollum/client";

export type VideoType =
  | "licensed"
  | "licensedByMe"
  | "myVideos"
  | "myVideosLicensed"
  | "myVideosUnlicensed";

export function useVideos(videoType: VideoType, userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  const query = useQuery({
    queryKey: ["videos", videoType, targetUserId],
    queryFn: async () => {
      // Safety check: Cannot fetch user-specific videos without a user ID
      if (!targetUserId && videoType !== "licensed") {
        return [];
      }
      const data = await getVideosFromSupabase(targetUserId || "", videoType);
      return data || [];
    },
    enabled: !!targetUserId || videoType === "licensed",
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      console.log("Syncing videos for user:", user.id);

      const videos = await fetchAllVideos();
      const profile = await getProfile(user.id);
      const autoLicense = profile?.auto_license_videos || "none";
      const autoLicenseSince = profile?.auto_license_since;

      await saveVideosToSupabase(
        user.id,
        videos,
        autoLicense,
        autoLicenseSince,
      );
      return videos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  // Update mutation (stats)
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      console.log("Updating video stats for user:", user.id);

      const videos = await fetchAllVideos();
      const profile = await getProfile(user.id);
      const autoLicense = profile?.auto_license_videos || "none";
      const autoLicenseSince = profile?.auto_license_since;

      await saveVideosToSupabase(
        user.id,
        videos,
        autoLicense,
        autoLicenseSince,
      );

      const updatePromises = videos.map((video: any) =>
        updateVideoStatistics(video.id, video.viewCount),
      );
      await Promise.all(updatePromises);
      return videos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  // Realtime Subscription
  useEffect(() => {
    if (!query.data) return;

    let filter = "";
    if (videoType === "myVideos" && user?.id) {
      filter = `user_id=eq.${user.id}`;
    } else if (videoType === "licensed") {
      filter = `islicensed=eq.true`;
    } else if (videoType === "licensedByMe" && user?.id) {
      filter = `creator_id=eq.${user.id}`;
    }

    if (!filter) return;

    const channel = supabase
      .channel(`video-updates-${videoType}-${user?.id || "public"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "videos",
          filter,
        },
        (payload: any) => {
          // If it's my own video and I'm on public licensed view, maybe skip
          if (
            videoType === "licensed" &&
            user?.id &&
            payload.new &&
            payload.new.creator_id === user.id
          ) {
            return;
          }
          queryClient.invalidateQueries({
            queryKey: ["videos", videoType, targetUserId],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoType, user?.id, query.data, queryClient, targetUserId]);

  // Auto-sync if empty and it's "myVideos"
  useEffect(() => {
    if (
      query.isSuccess &&
      query.data.length === 0 &&
      videoType === "myVideos" &&
      !syncMutation.isPending &&
      !syncMutation.isError
    ) {
      // syncMutation.mutate(); // Potentially dangerous auto-sync loop if YouTube also returns empty.
      // Better to let user trigger it via LoadVideosButton.
    }
  }, [query.isSuccess, query.data?.length, videoType]);

  return {
    videos: query.data || [],
    hasVideos: (query.data?.length || 0) > 0,
    isSyncing: syncMutation.isPending || updateMutation.isPending,
    isLoading: query.isLoading,
    isError: query.isError,
    sync: () => syncMutation.mutate(),
    update: () => updateMutation.mutate(),
  };
}
