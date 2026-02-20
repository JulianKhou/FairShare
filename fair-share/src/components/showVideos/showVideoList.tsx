import { useVideos } from "../../hooks/youtube/useVideos";
import { VideoItem } from "./videoItem";
interface ShowVideoListProps {
  videoType?: "licensed" | "licensedByMe" | "myVideos";
  userId?: string;
}

export default function ShowVideoList({
  videoType = "myVideos",
  userId,
}: ShowVideoListProps) {
  const { videos, isLoading } = useVideos(videoType, userId);
  if (isLoading) {
    return <div>Laden...</div>;
  }

  return (
    <div className="video-list flex items-center justify-center gap-4 flex-wrap">
      {videos.map((video) => (
        <VideoItem key={video.id} video={video} userId={userId} />
      ))}
    </div>
  );
}
