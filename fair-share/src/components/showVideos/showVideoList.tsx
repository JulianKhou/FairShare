import { useVideos } from "../../hooks/youtube/useVideos";

export default function ShowVideoList() {
    const { videos, isLoading } = useVideos();

    if (isLoading) {
        return <div>Laden...</div>;
    }

    return (
        <div className="video-list">
            {videos.map((video) => (
                <div key={video.id} className="video-item">
                    <h3>{video.title}</h3>
                    <img src={video.thumbnail} alt={video.title} />
                    <h2>{video.last_view_count}</h2>
                    {/* Add more video details here if needed */}
                </div>
            ))}
        </div>
    );
}