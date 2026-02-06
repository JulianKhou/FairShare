import { CloseBtn } from "../utility/closeBtn";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useVideoDetails } from "../../hooks/videoDetails/useVideoDetails";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";
import { useFindVideo } from "@/hooks/videoDetails/useFindVideo";
import { useState } from "react";
import { VideoItem } from "./videoItem";
import { BuyOptions } from "./buyOptions";
import { useAdmin } from "@/hooks/auth/useAdmin";
import { useLocation } from "react-router-dom";
import { ChangeVideoSettings } from "../debug/changeVideoSettings";
import { useVideoSimulation } from "@/hooks/debughooks/changeViewsLokal";
interface VideoDetailsProps {
  video: any;
  isOpen: boolean;
  onClose: () => void;
  mode?: "owner" | "public";
}
const videoDetailCss =
  "video-details flex  justify-between fixed top-4/7 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5/6 h-4/5 bg-card rounded-2xl p-2 ";



export const VideoDetails = ({
  video,
  isOpen,
  onClose,
  mode,
}: VideoDetailsProps) => {
  const [videoUrl, setVideoUrl] = useState("");
  const { isLicensed, toggleLicense } = useVideoDetails(video);
  const { video: foundVideo, findVideo, isLoading } = useFindVideo();
  if (!isOpen) return null;

  const handleSearch = () => {
    if (videoUrl) {
      findVideo(videoUrl);
    }
  };
  const { isAdmin, loading } = useAdmin();
  const location = useLocation();

  // Magic Query auslesen
  const queryParams = new URLSearchParams(location.search);
  const isDebugRequested = queryParams.get('debug') === 'true';

  // Debug-Modus ist nur aktiv, wenn User Admin ist UND ?debug=true in der URL steht
  const showDebugTools = isAdmin && isDebugRequested;

  // --- Simulation Hooks ---
  const {
    simulatedVideo: simulatedMainVideo,
    handleViewsChange: handleMainViewsChange,
    setMockViews: setMainMockViews
  } = useVideoSimulation(video);

  const {
    simulatedVideo: simulatedFoundVideo,
    handleViewsChange: handleFoundViewsChange,
    setMockViews: setFoundMockViews
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
      <div className="video-details-left">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-fit h-fit object-cover rounded-2xl p-2"
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col ml-3">
          <h1>{video.title}</h1>
          <h2 className="text-muted-foreground self-start text-xs ">
            {/* Hier zeigen wir die Views vom Simulations-Objekt an, falls vorhanden */}
            {activeMainVideo.last_view_count} Views
          </h2>
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
      {mode === "owner" && (
        <div>

          <div>



          </div>
          <div className="video-details-right flex flex-col w-full">
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
            <div className="flex flex-col">
              <h2>Link Video</h2>
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
              {foundVideo && <>
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
              </>}
              {/* Hier übergeben wir die simulierten Videos an BuyOptions */}
              {foundVideo && <BuyOptions videoCreator={activeFoundVideo} videoReactor={activeMainVideo} />}
            </div>
          </div>
        </div>
      )}
      {mode === "public" && (
        /* Auch hier simuliertes Video nutzen */
        <BuyOptions videoCreator={activeMainVideo} videoReactor={activeMainVideo} />
      )}
      <CloseBtn onClose={onClose} />
    </div>
  );
};
