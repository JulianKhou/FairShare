import { useParams, useNavigate } from "react-router-dom";
import { VideoDetails } from "@/components/showVideos/videoDetails";
import { Loader2, AlertCircle } from "lucide-react";
import { useVideo } from "@/hooks/queries/useVideo";

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();

  const { data: video, isLoading: loading, error } = useVideo(videoId);

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
        <p className="text-lg font-medium">
          {error instanceof Error ? error.message : "Video nicht gefunden."}
        </p>
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
        onClose={() => navigate("/overview")}
        mode="public"
      />
    </div>
  );
}
