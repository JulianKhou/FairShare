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
  searchQuery?: string;
}

export default function ShowVideoList({
  videoType = "myVideos",
  userId,
  searchQuery = "",
}: ShowVideoListProps) {
  const { videos, isLoading } = useVideos(videoType, userId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  const filtered = searchQuery.trim()
    ? videos?.filter(
        (v) =>
          v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.channel_title?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : videos;

  if (!filtered || filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10">
        <p className="text-muted-foreground font-medium">
          {searchQuery
            ? `Keine Videos für "${searchQuery}" gefunden.`
            : "Keine Videos gefunden."}
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
        Videos gefunden
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
        {filtered.map((video) => (
          <VideoItem key={video.id} video={video} userId={userId} />
        ))}
      </div>
    </>
  );
}
