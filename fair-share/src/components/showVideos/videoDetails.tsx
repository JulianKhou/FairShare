import { CloseBtn } from "../utility/closeBtn";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useVideoDetails } from "../../hooks/videoDetails/useVideoDetails";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search, Loader2 } from "lucide-react";
import { useFindVideo } from "@/hooks/videoDetails/useFindVideo";
import { useState, useEffect } from "react";
import { VideoItem } from "./videoItem";
import { BuyOptions } from "./buyOptions";
import { useAdmin } from "@/hooks/auth/useAdmin";
import { useLocation } from "react-router-dom";
import { ChangeVideoSettings } from "../debug/changeVideoSettings";
import { useVideoSimulation } from "@/hooks/debughooks/changeViewsLokal";
import {
  getContractsForVideo,
  ReactionContract,
  getPendingReactionContracts,
  updateReactionContract,
  deleteReactionContract,
} from "@/services/supabaseCollum/reactionContract";
import { generateLicensePDF } from "@/services/supabaseFunctions";

interface VideoDetailsProps {
  video: any;
  isOpen: boolean;
  onClose: () => void;
  mode?: "owner" | "public";
}
const videoDetailCss =
  "video-details flex  flex-start justify-between fixed top-4/7 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5/6 h-4/5 bg-card rounded-2xl p-2 ";

export const VideoDetails = ({
  video,
  isOpen,
  onClose,
  mode,
}: VideoDetailsProps) => {
  const [videoUrl, setVideoUrl] = useState("");
  const { isLicensed, toggleLicense } = useVideoDetails(video);
  const { video: foundVideo, findVideo, isLoading } = useFindVideo();
  const [activeTab, setActiveTab] = useState<"details" | "pending">("details");
  const [contracts, setContracts] = useState<ReactionContract[]>([]);
  const [pendingContracts, setPendingContracts] = useState<ReactionContract[]>(
    [],
  );
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && video?.id) {
      // Fetch existing purchased licenses
      getContractsForVideo(video.id).then((data) => {
        if (data) setContracts(data as ReactionContract[]);
      });
      // Fetch pending requests
      if (mode === "owner") {
        getPendingReactionContracts(video.id).then((data) => {
          if (data) setPendingContracts(data as ReactionContract[]);
        });
      }
    }
  }, [isOpen, video, mode]);

  const handleAccept = async (contractId: string) => {
    if (processingIds.has(contractId)) return;

    setProcessingIds((prev) => new Set(prev).add(contractId));
    try {
      await updateReactionContract(contractId, { accepted_by_licensor: true });

      // Generate and send PDF
      try {
        await generateLicensePDF(contractId);
        alert("Contract accepted! PDF has been emailed to both parties. ✅");
      } catch (pdfError) {
        console.error("Failed to generate PDF:", pdfError);
        alert(
          "Contract accepted, but PDF generation failed. Please contact support.",
        );
      }

      // Refresh lists
      const pending = await getPendingReactionContracts(video.id);
      const accepted = await getContractsForVideo(video.id);
      if (pending) setPendingContracts(pending as ReactionContract[]);
      if (accepted) setContracts(accepted as ReactionContract[]);
    } catch (e) {
      console.error("Failed to accept contract", e);
      alert("Failed to accept contract. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(contractId);
        return newSet;
      });
    }
  };

  const handleDelete = async (contractId: string) => {
    try {
      await deleteReactionContract(contractId);
      // Refresh list
      const pending = await getPendingReactionContracts(video.id);
      if (pending) setPendingContracts(pending as ReactionContract[]);
    } catch (e) {
      console.error("Failed to delete contract", e);
    }
  };

  if (!isOpen) return null;

  const handleSearch = () => {
    if (videoUrl) {
      findVideo(videoUrl);
    }
  };
  const { isAdmin } = useAdmin();
  const location = useLocation();

  // Magic Query auslesen
  const queryParams = new URLSearchParams(location.search);
  const isDebugRequested = queryParams.get("debug") === "true";

  // Debug-Modus ist nur aktiv, wenn User Admin ist UND ?debug=true in der URL steht
  const showDebugTools = isAdmin && isDebugRequested;

  // --- Simulation Hooks ---
  const {
    simulatedVideo: simulatedMainVideo,
    handleViewsChange: handleMainViewsChange,
    setMockViews: setMainMockViews,
  } = useVideoSimulation(video);

  const {
    simulatedVideo: simulatedFoundVideo,
    handleViewsChange: handleFoundViewsChange,
    setMockViews: setFoundMockViews,
  } = useVideoSimulation(foundVideo);

  // Entscheidung: Welches Video nutzen wir für die Anzeige?
  // Im Debug-Mode nutzen wir das simulierte Video, sonst das echte.
  // Das Hook liefert aber immer ein simulatedVideo zurück (initial clone des Originalvideos).
  // Es ist also sicher, immer `simulatedMainVideo` zu nutzen, wenn wir konsistent sein wollen.
  // Aber um sicherzugehen, dass ohne Debug alles wie früher ist:
  const activeMainVideo = simulatedMainVideo || video;
  const activeFoundVideo = simulatedFoundVideo || foundVideo;

  return (
    <div className={videoDetailCss} onClick={(e) => e.stopPropagation()}>
      <div className="video-details-left flex flex-col h-full overflow-y-auto">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-fit h-fit object-cover rounded-2xl p-2"
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col ml-3 mt-2">
          <h1>{video.title}</h1>
          <h2 className="text-muted-foreground self-start text-xs ">
            {/* Hier zeigen wir die Views vom Simulations-Objekt an, falls vorhanden */}
            {activeMainVideo.last_view_count} Views
          </h2>

          {/* Tab Navigation for Owner */}
          {mode === "owner" && (
            <div className="flex space-x-2 mt-4 mb-2">
              <Button
                variant={activeTab === "details" ? "default" : "outline"}
                onClick={() => setActiveTab("details")}
                size="sm"
              >
                Details
              </Button>
              <Button
                variant={activeTab === "pending" ? "default" : "outline"}
                onClick={() => setActiveTab("pending")}
                size="sm"
              >
                Pending Requests ({pendingContracts.length})
              </Button>
            </div>
          )}

          {/* PENDING REACTIONS TAB */}
          {mode === "owner" && activeTab === "pending" && (
            <div className="mt-4 p-4 bg-secondary/20 rounded-lg">
              <h3 className="text-sm font-semibold mb-2">
                Pending Reaction Requests
              </h3>
              {pendingContracts.length > 0 ? (
                <ul className="space-y-2">
                  {pendingContracts.map((contract) => (
                    <li
                      key={contract.id}
                      className="bg-card p-3 rounded flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">
                            {contract.licensee_name || "Unknown User"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Original ID: {contract.original_video_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Offer: {contract.pricing_value}{" "}
                            {contract.pricing_currency} (
                            {contract.pricing_model_type === 1
                              ? "Fixed"
                              : contract.pricing_model_type === 2
                                ? "Per View"
                                : "CPM"}
                            )
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(contract.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(contract.id)}
                          disabled={processingIds.has(contract.id)}
                        >
                          {processingIds.has(contract.id) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            "Accept"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(contract.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No pending requests.
                </p>
              )}
            </div>
          )}

          {/* DETAILS TAB (Existing Content) */}
          {(activeTab === "details" || mode !== "owner") && (
            <>
              {/* License Details Section */}
              <div className="mt-4 p-4 bg-secondary/20 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">License Details</h3>
                {mode === "owner" ? (
                  contracts.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Purchased by:
                      </p>
                      <ul className="text-sm space-y-1">
                        {contracts.map((contract) => (
                          <li
                            key={contract.id}
                            className="flex justify-between items-center bg-card p-2 rounded"
                          >
                            <span>
                              {contract.licensee_name || "Unknown User"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(
                                contract.created_at,
                              ).toLocaleDateString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No licenses sold yet.
                    </p>
                  )
                ) : (
                  // Public/View Mode
                  <div className="space-y-2">
                    <p className="text-sm">
                      Owner:{" "}
                      <span className="font-medium">
                        {video.channel_title || "Unknown Channel"}
                      </span>
                    </p>
                    {/* Check if *I* bought it? We'd need current user ID matching licensee_id */}
                    {/* For now, just show total licenses sold maybe? */}
                    <p className="text-xs text-muted-foreground">
                      {contracts.length} licenses sold total.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {showDebugTools && simulatedMainVideo && (
            <>
              <ChangeVideoSettings
                video={simulatedMainVideo}
                handleViewsChange={handleMainViewsChange}
                setMockViews={setMainMockViews}
              />
            </>
          )}
        </div>
      </div>
      {/* Right Column content only shows in details tab if owner */}
      {mode === "owner" && activeTab === "details" && (
        <div>
          <div></div>
          <div className="video-details-right flex flex-col w-full mr-5">
            <h2 className="self-start text-xl m-5 ">License Video</h2>
            <Field orientation="horizontal" className="max-w-sm">
              <FieldContent>
                <FieldLabel htmlFor="switch-focus-mode">
                  License for commercial use
                </FieldLabel>
                <FieldDescription>
                  License the video for commercial use
                </FieldDescription>
              </FieldContent>
              <Switch onCheckedChange={toggleLicense} checked={isLicensed} />
            </Field>
            <div className="flex flex-col gap-2">
              <h2 className="self-start text-xl mt-5 ">Link Video</h2>
              <InputGroup className="max-w-xs">
                <InputGroupInput
                  placeholder="Search..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <InputGroupAddon>
                  <Search className="w-fit max-w-xs" />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  {/* Optional: Show status or results count here if needed */}
                  {isLoading ? "Searching..." : foundVideo ? "1 result" : ""}
                </InputGroupAddon>
              </InputGroup>

              <Button className="w-fit max-w-xs" onClick={handleSearch}>
                Link Video
              </Button>

              {/* Optional: Feedback if a video is found */}
              {foundVideo && (
                <>
                  <VideoItem video={foundVideo} />
                  {showDebugTools && simulatedFoundVideo && (
                    <>
                      <ChangeVideoSettings
                        video={simulatedFoundVideo}
                        handleViewsChange={handleFoundViewsChange}
                        setMockViews={setFoundMockViews}
                      />
                    </>
                  )}
                </>
              )}
              {/* Hier übergeben wir die simulierten Videos an BuyOptions */}
              {foundVideo && (
                <BuyOptions
                  videoCreator={activeFoundVideo}
                  videoReactor={activeMainVideo}
                />
              )}
            </div>
          </div>
        </div>
      )}
      {mode === "public" && (
        /* Auch hier simuliertes Video nutzen */
        <BuyOptions
          videoCreator={activeMainVideo}
          videoReactor={activeMainVideo}
        />
      )}
      <CloseBtn onClose={onClose} />
    </div>
  );
};
