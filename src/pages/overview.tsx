import { useState } from "react";
import ShowVideoList from "../components/showVideos/showVideoList";
import LoadVideosButton from "../components/showVideos/loadVideosButton";
import { useAuth } from "../hooks/auth/useAuth";
import { useSearchParams } from "react-router-dom";
import { IconVideoOff } from "@tabler/icons-react";

type VideoMode = "public" | "mine";

function Overview() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read mode from URL param so links & back-button work
  const modeParam = searchParams.get("view") as VideoMode | null;
  const [mode, setMode] = useState<VideoMode>(
    modeParam === "mine" ? "mine" : "public",
  );
  const [myFilter, setMyFilter] = useState<
    "myVideos" | "myVideosLicensed" | "myVideosUnlicensed"
  >("myVideos");

  const switchMode = (next: VideoMode) => {
    setMode(next);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set("view", next);
        return p;
      },
      { replace: true },
    );
  };

  return (
    <div className="flex flex-col items-center pt-10 pb-20 gap-8 w-full">
      <div className="w-full max-w-7xl px-4 lg:px-8">
        
        {/* Toggle Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-border/50 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {mode === "public" ? "Übersicht" : "Meine Videos"}
          </h1>

          {/* Segmented toggle */}
          <div className="flex items-center bg-muted/50 backdrop-blur-sm rounded-full p-1 border border-border/50">
            <button
              onClick={() => switchMode("public")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                mode === "public"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🌐 Öffentlich
            </button>
            <button
              onClick={() => switchMode("mine")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                mode === "mine"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🎥 Meine Videos
            </button>
          </div>
        </div>

        {/* Content */}
        {mode === "public" ? (
          user ? (
            <ShowVideoList videoType="licensed" userId={user.id} />
          ) : (
            <ShowVideoList videoType="licensed" userId={undefined} />
          )
        ) : // My Videos mode
        user ? (
          <div className="flex flex-col gap-6">
            
            {/* Top Toolbar for My Videos */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center bg-muted/40 rounded-full p-1 border border-border/30">
                {(
                  [
                    { value: "myVideos", label: "Alle" },
                    { value: "myVideosLicensed", label: "Lizenziert" },
                    { value: "myVideosUnlicensed", label: "Nicht lizenziert" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMyFilter(option.value)}
                    className={`px-4 py-1.5 rounded-full text-sm md:text-xs lg:text-sm font-medium transition-all duration-300 ${
                      myFilter === option.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              <LoadVideosButton />
            </div>
            
            <ShowVideoList videoType={myFilter} userId={user.id} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border rounded-2xl bg-muted/10">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <IconVideoOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Nicht angemeldet</h2>
            <p className="text-muted-foreground max-w-sm">
              Bitte melde dich an, um deine Videos zu sehen und zu verwalten.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Overview;
