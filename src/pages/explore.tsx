import { useEffect, useRef, useState } from "react";
import ShowVideoList from "../components/showVideos/showVideoList";
import LoadVideosButton from "../components/showVideos/loadVideosButton";
import { useAuth } from "../hooks/auth/useAuth";
import { useSearchParams } from "react-router-dom";
import { deleteReactionContract } from "../services/supabaseCollum/reactionContract";
import { toast } from "sonner";

type VideoMode = "public" | "mine";

function Explore() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const alertShown = useRef(false);

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

  // Handle Stripe redirect params
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const contractId = searchParams.get("contractId");

    if (alertShown.current) return;

    if (success) {
      alertShown.current = true;
      toast.success("Zahlung erfolgreich!", {
        description: "Deine Lizenz wurde erfolgreich erstellt.",
      });
      setSearchParams({}, { replace: true });
    }

    if (canceled) {
      alertShown.current = true;
      if (contractId) {
        deleteReactionContract(contractId)
          .then(() => {
            toast.info("Zahlung abgebrochen", {
              description: "Die ausstehende Anfrage wurde gelöscht.",
            });
          })
          .catch((err) => {
            console.error("Failed to delete contract:", err);
            toast.error("Zahlung abgebrochen", {
              description:
                "Die ausstehende Anfrage konnte nicht gelöscht werden.",
            });
          });
      } else {
        toast.info("Zahlung abgebrochen");
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="flex flex-col items-center pt-20 gap-8 w-full">
      <div className="w-full max-w-6xl px-4">
        {/* Toggle Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="text-2xl font-bold">
            {mode === "public" ? "Videos erkunden" : "Meine Videos"}
          </h1>

          {/* Segmented toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
            <button
              onClick={() => switchMode("public")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === "public"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🌐 Öffentliche Videos
            </button>
            <button
              onClick={() => switchMode("mine")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === "mine"
                  ? "bg-background shadow text-foreground"
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
          <div className="flex flex-col gap-4">
            <LoadVideosButton />
            <div className="flex items-center bg-muted rounded-lg p-1 gap-1 w-fit">
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
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    myFilter === option.value
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <ShowVideoList videoType={myFilter} userId={user.id} />
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed rounded-lg bg-muted/30">
            <p className="text-muted-foreground">
              Bitte melde dich an, um deine Videos zu sehen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
