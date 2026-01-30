import { useVideos } from "../../hooks/youtube/useVideos";
import { VideoItem } from "./videoItem";

export default function ShowVideoList() {
  const { videos, isLoading } = useVideos();
  if (isLoading) {
    return <div>Laden...</div>;
  }

  return (
    <div className="video-list flex items-center justify-center gap-4 flex-wrap">
      {videos.map((video) => (
        <VideoItem video={video} />
      ))}
    </div>
  );
}
