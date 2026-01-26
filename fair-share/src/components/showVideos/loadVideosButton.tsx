// src/components/showVideos/LoadVideosButton.tsx
import { useVideos } from '../../hooks/youtube/useVideos';
import { useUpdateVideos } from '../../hooks/youtube/useUpdateVideos';

function LoadVideosButton() {
    // 1. Alle Hooks ganz oben "auspacken"
    const { hasVideos, isSyncing, sync, videos } = useVideos();
    // 2. Den neuen Update-Hook verwenden
    const { updateVideos, loading: isUpdating } = useUpdateVideos();

    return (
        <div className="video-container">
            {/* Logik für den Button-Bereich */}
            <div className="actions">
                {!hasVideos ? (
                    <button 
                        className="load-btn btn btn-primary" 
                        onClick={sync} 
                        disabled={isSyncing}
                    >
                        {isSyncing ? 'Videos werden geladen...' : 'Videos laden'}
                    </button>
                ) : (
                    <button 
                        className="update-btn btn btn-secondary" 
                        onClick={updateVideos} 
                        disabled={isUpdating || isSyncing}
                    >
                        {isUpdating ? 'Aktualisiere...' : 'Liste aktualisieren'}
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