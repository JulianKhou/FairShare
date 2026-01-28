import { useVideos } from "../../hooks/youtube/useVideos";

export default function ShowVideoList() {
  const { videos, isLoading } = useVideos();

  if (isLoading) {
    return <div>Laden...</div>;
  }
  const videoClasses =
    "video-item flex flex-col items-center min-w-[200px] rounded-lg w-52 h-52";
  const videoClassesHover = "hover:bg-white/5 transition-colors";
  const imgClasses = "w-48 h-40 object-contain rounded-lg p-2";

  return (
    <div className="video-list flex items-center justify-center gap-4 flex-wrap">
      {videos.map((video) => (
        <div key={video.id} className={videoClasses + " " + videoClassesHover}>
          <img
            src={video.thumbnail}
            alt={video.title}
            className={imgClasses}
            referrerPolicy="no-referrer"
          />
          <h3 className="text-fair-text self-start ml-3">{video.title}</h3>
          <h2 className="text-fair-text-muted self-start text-xs ml-3">
            {video.last_view_count} Views
          </h2>
          {/* Add more video details here if needed */}
        </div>
      ))}
    </div>
  );
}
