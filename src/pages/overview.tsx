import { useState } from "react";
import ShowVideoList from "../components/showVideos/showVideoList";
import CreatorList from "../components/showCreators/CreatorList";
import { useAuth } from "../hooks/auth/useAuth";
import { IconVideo, IconUsers } from "@tabler/icons-react";

type ViewMode = "videos" | "channels";

function Overview() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("videos");

  return (
    <div className="flex flex-col items-center pt-10 pb-20 gap-8 w-full">
      <div className="w-full max-w-7xl px-4 lg:px-8">
        
        {/* Toggle Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-border/50 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Übersicht
          </h1>

          {/* Segmented toggle */}
          <div className="flex items-center bg-muted/50 backdrop-blur-sm rounded-full p-1 border border-border/50">
            <button
              onClick={() => setViewMode("videos")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                viewMode === "videos"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconVideo className="h-4 w-4" /> Öffentliche Videos
            </button>
            <button
              onClick={() => setViewMode("channels")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                viewMode === "channels"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconUsers className="h-4 w-4" /> Alle Kanäle
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === "videos" ? (
          user ? (
            <ShowVideoList videoType="licensed" userId={user.id} />
          ) : (
            <ShowVideoList videoType="licensed" userId={undefined} />
          )
        ) : (
          <CreatorList />
        )}
      </div>
    </div>
  );
}

export default Overview;
