// src/components/showVideos/LoadVideosButton.tsx
import { useVideos } from "../../hooks/youtube/useVideos";

function LoadVideosButton() {
  const { hasVideos, isSyncing, sync, update, videos } = useVideos(
    "myVideos",
    "",
  );

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
            onClick={update}
            disabled={isSyncing}
          >
            {isSyncing ? "Aktualisiere..." : "Liste aktualisieren"}
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
