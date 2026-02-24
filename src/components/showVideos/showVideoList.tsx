import { useVideos } from "../../hooks/youtube/useVideos";
import { VideoItem } from "./videoItem";
interface ShowVideoListProps {
  videoType?:
    | "licensed"
    | "licensedByMe"
    | "myVideos"
    | "myVideosLicensed"
    | "myVideosUnlicensed";
  userId?: string;
}

export default function ShowVideoList({
  videoType = "myVideos",
  userId,
}: ShowVideoListProps) {
  const { videos, isLoading } = useVideos(videoType, userId);
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10">
        <p className="text-muted-foreground font-medium">Keine Videos gefunden.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
      {videos.map((video) => (
        <VideoItem key={video.id} video={video} userId={userId} />
      ))}
    </div>
  );
}
