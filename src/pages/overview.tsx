import { useState } from "react";
import ShowVideoList from "../components/showVideos/showVideoList";
import CreatorList from "../components/showCreators/CreatorList";
import { useAuth } from "../hooks/auth/useAuth";
import {
  IconVideo,
  IconUsers,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";

type ViewMode = "videos" | "channels";

function Overview() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("videos");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col w-full">
      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden bg-linear-to-b from-simple-purple/10 via-background to-background py-16 pb-12 px-4">
        {/* Background blur orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-simple-purple/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-simple-teal/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-simple-purple/15 border border-simple-purple/30 text-simple-purple text-sm font-semibold">
            <IconSparkles size={14} />
            Verfügbare Lizenzen
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Hol dir{" "}
            <span className="bg-clip-text text-transparent bg-linear-to-r from-simple-purple to-simple-teal">
              offizielle Lizenzen
            </span>{" "}
            für deine Reactions
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Stöbere durch tausende Videos von Creatoren, die ihr Content zur
            Lizenzierung freigegeben haben.
          </p>

          {/* Search Input */}
          <div className="relative w-full max-w-xl">
            <IconSearch
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder={
                viewMode === "videos"
                  ? "Video oder Kanal suchen…"
                  : "Kanal suchen…"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-simple-purple/50 focus:ring-2 focus:ring-simple-purple/20 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 pb-20">
        {/* Upgraded Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center bg-white/5 backdrop-blur-sm rounded-full p-1 border border-white/10 self-start">
            <button
              onClick={() => setViewMode("videos")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                viewMode === "videos"
                  ? "bg-linear-to-r from-simple-purple to-simple-teal text-white shadow-lg shadow-simple-purple/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconVideo className="h-4 w-4" />
              Öffentliche Videos
            </button>
            <button
              onClick={() => setViewMode("channels")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                viewMode === "channels"
                  ? "bg-linear-to-r from-simple-purple to-simple-teal text-white shadow-lg shadow-simple-purple/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconUsers className="h-4 w-4" />
              Alle Kanäle
            </button>
          </div>

          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              Suche nach:{" "}
              <span className="font-semibold text-foreground">
                "{searchQuery}"
              </span>
            </p>
          )}
        </div>

        {/* Content */}
        {viewMode === "videos" ? (
          <ShowVideoList
            videoType="licensed"
            userId={user?.id}
            searchQuery={searchQuery}
          />
        ) : (
          <CreatorList searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
}

export default Overview;
