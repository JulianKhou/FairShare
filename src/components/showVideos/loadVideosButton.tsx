// src/components/showVideos/LoadVideosButton.tsx
import { useVideos } from "../../hooks/youtube/useVideos";
import { useUpdateVideos } from "../../hooks/youtube/useUpdateVideos";

function LoadVideosButton() {
  // 1. Alle Hooks ganz oben "auspacken"
  const { hasVideos, isSyncing, sync, videos } = useVideos("myVideos", "");
  // 2. Den neuen Update-Hook verwenden
  const { updateVideos, loading: isUpdating } = useUpdateVideos();
  const buttonClasses =
    "w-full text-left px-3 py-2 rounded-lg border border-white/10";
  const buttonClassesHover = "hover:bg-white/5 transition-colors";
  return (
    <div className="video-container flex items-center justify-center gap-4">
      {/* Logik für den Button-Bereich */}
      <div className="actions">
        {!hasVideos ? (
          <button
            className={buttonClasses + " " + buttonClassesHover}
            onClick={sync}
            disabled={isSyncing}
          >
            {isSyncing ? "Videos werden geladen..." : "Videos laden"}
          </button>
        ) : (
          <button
            className={buttonClasses + " " + buttonClassesHover}
            onClick={updateVideos}
            disabled={isUpdating || isSyncing}
          >
            {isUpdating ? "Aktualisiere..." : "Liste aktualisieren"}
          </button>
        )}
      </div>

      {/* Hier käme die Liste der Videos hin */}
      {hasVideos && (
        <div className="video-stats">
          <p>{videos.length} Videos gefunden.</p>
        </div>
      )}
    </div>
  );
}

export default LoadVideosButton;
