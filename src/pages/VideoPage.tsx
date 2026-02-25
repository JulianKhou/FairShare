import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVideoFromSupabaseById } from "@/services/supabaseCollum/database";
import { VideoDetails } from "@/components/showVideos/videoDetails";
import { Loader2, AlertCircle } from "lucide-react";

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();

  const [video, setVideo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) {
      setError("Keine Video-ID angegeben.");
      setLoading(false);
      return;
    }

    getVideoFromSupabaseById(videoId)
      .then((data) => {
        if (!data || data.length === 0) {
          setError("Video wurde nicht gefunden.");
        } else {
          setVideo(data[0]);
        }
      })
      .catch(() => setError("Fehler beim Laden des Videos."))
      .finally(() => setLoading(false));
  }, [videoId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <AlertCircle className="h-12 w-12 opacity-40" />
        <p className="text-lg font-medium">{error ?? "Video nicht gefunden."}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary underline underline-offset-4 hover:no-underline"
        >
          Zurück
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <VideoDetails
        video={video}
        isOpen={true}
        onClose={() => navigate(-1)}
        mode="public"
      />
    </div>
  );
}
