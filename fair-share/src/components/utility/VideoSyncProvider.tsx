import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/auth/useAuth";
import { fetchAllVideos } from "../../services/youtube";
import { saveVideosToSupabase } from "../../services/supabaseCollum/database";
import { supabase } from "../../services/supabaseCollum/client";
import { getProfile } from "../../services/supabaseCollum/profiles";

type SyncStatus = "idle" | "syncing" | "success" | "error";

/**
 * VideoSyncProvider: Automatically syncs YouTube videos when a user logs in.
 * Shows a small toast notification in the top-right corner during sync.
 * Wraps content and renders without blocking children.
 */
export const VideoSyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const hasSynced = useRef(false);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    // Trigger sync when user logs in (new user or re-login)
    if (!user?.id) {
      // User logged out — reset for next login
      hasSynced.current = false;
      prevUserId.current = null;
      return;
    }

    // Only sync once per login session (avoid double-sync in StrictMode)
    if (hasSynced.current && prevUserId.current === user.id) return;

    hasSynced.current = true;
    prevUserId.current = user.id;

    const syncVideos = async () => {
      // Check if provider_token is available (only present right after OAuth login)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.provider_token) {
        console.log(
          "VideoSyncProvider: No provider_token — skipping sync (normal on page refresh)",
        );
        return;
      }

      setStatus("syncing");
      setMessage("YouTube-Videos werden geladen...");
      setVisible(true);

      try {
        const videos = await fetchAllVideos();

        if (videos && videos.length > 0) {
          const profile = await getProfile(user.id);
          const autoLicense = profile?.auto_license_videos ?? false;
          await saveVideosToSupabase(user.id, videos, autoLicense);
          setStatus("success");
          setMessage(`${videos.length} Videos synchronisiert ✓`);
        } else {
          setStatus("success");
          setMessage("Keine neuen Videos gefunden");
        }
      } catch (err: any) {
        console.error("Auto-Sync Fehler:", err);
        setStatus("error");
        setMessage("Sync fehlgeschlagen");
      }

      // Auto-hide after 3 seconds
      setTimeout(() => {
        setVisible(false);
        // Reset after fade-out animation
        setTimeout(() => setStatus("idle"), 300);
      }, 3000);
    };

    syncVideos();
  }, [user?.id]);

  return (
    <>
      {children}
      {/* Toast Notification */}
      {status !== "idle" && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.625rem",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            background:
              status === "error"
                ? "rgba(239, 68, 68, 0.15)"
                : "rgba(255, 255, 255, 0.08)",
            border:
              status === "error"
                ? "1px solid rgba(239, 68, 68, 0.3)"
                : "1px solid rgba(255, 255, 255, 0.12)",
            color: status === "error" ? "#fca5a5" : "#e2e8f0",
            fontSize: "0.8125rem",
            fontWeight: 500,
            fontFamily: "'Inter Variable', sans-serif",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateX(0) scale(1)"
              : "translateX(20px) scale(0.95)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: "none",
          }}
        >
          {/* Icon / Spinner */}
          {status === "syncing" && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                animation: "sync-spin 1s linear infinite",
                flexShrink: 0,
              }}
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="28"
                strokeDashoffset="8"
                strokeLinecap="round"
              />
            </svg>
          )}
          {status === "success" && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0, color: "#86efac" }}
            >
              <path
                d="M4 8.5L6.5 11L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {status === "error" && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M5 5L11 11M11 5L5 11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
          {message}
        </div>
      )}
      {/* Keyframe for spinner — injected once */}
      <style>{`
        @keyframes sync-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};
