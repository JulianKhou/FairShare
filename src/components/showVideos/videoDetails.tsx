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
import {
  Search,
  Loader2,
  Eye,
  Shield,
  Users,
  Clock,
  Check,
  X,
  Link2,
  ShoppingCart,
  ExternalLink,
  Youtube,
  ArrowRight,
  TrendingUp,
  BadgeCheck,
} from "lucide-react";
import { useFindVideo } from "@/hooks/videoDetails/useFindVideo";
import { useState, useEffect } from "react";
import { VideoItem } from "./videoItem";
import { BuyOptions } from "./buyOptions";
import { useAdmin } from "@/hooks/auth/useAdmin";
import { useLocation } from "react-router-dom";
import { ChangeVideoSettings } from "../debug/changeVideoSettings";
import { useVideoSimulation } from "@/hooks/debughooks/changeViewsLokal";
import {
  updateReactionContract,
  deleteReactionContract,
} from "@/services/supabaseCollum/reactionContract";
import { generateLicensePDF } from "@/services/supabaseFunctions";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useContractsForVideo } from "@/hooks/queries/useContractsForVideo";
import { usePendingContractsForVideo } from "@/hooks/queries/usePendingContractsForVideo";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getProfile, Profile } from "@/services/supabaseCollum/profiles";
import { useNavigate } from "react-router-dom";
import { useVideos } from "../../hooks/youtube/useVideos";
import { useAuth } from "../../hooks/auth/useAuth";

interface VideoDetailsProps {
  video: any;
  isOpen: boolean;
  onClose: () => void;
  mode?: "owner" | "public";
}

export const VideoDetails = ({
  video,
  isOpen,
  onClose,
  mode,
}: VideoDetailsProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState("");
  const { isLicensed, toggleLicense } = useVideoDetails(video);
  const { video: foundVideo, findVideo, isLoading } = useFindVideo();
  const [activeTab, setActiveTab] = useState<"details" | "pending">("details");
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  // Public view: reaction video step
  const [reactionUrl, setReactionUrl] = useState("");
  const {
    video: reactionVideo,
    findVideo: findReaction,
    isLoading: isLoadingReaction,
  } = useFindVideo();
  const [reactionStepDone, setReactionStepDone] = useState(false);
  const [reactionInputMode, setReactionInputMode] = useState<"mine" | "url">(
    "mine",
  );
  const [selectedMyVideo, setSelectedMyVideo] = useState<any>(null);
  // Fetch logged-in user's own videos
  const { user } = useAuth();
  const { videos: myVideos, isLoading: isLoadingMyVideos } =
    useVideos("myVideos");
  // Creator profile
  const [creatorProfile, setCreatorProfile] = useState<Profile | null>(null);
  useEffect(() => {
    if (video?.creator_id) {
      getProfile(video.creator_id).then(setCreatorProfile);
    }
  }, [video?.creator_id]);

  const { data: contracts = [] } = useContractsForVideo(video?.id, isOpen);
  const { data: pendingContracts = [] } = usePendingContractsForVideo(
    video?.id,
    isOpen,
    mode,
  );

  const handleAccept = async (contractId: string) => {
    if (processingIds.has(contractId)) return;
    setProcessingIds((prev) => new Set(prev).add(contractId));
    try {
      await updateReactionContract(contractId, { accepted_by_licensor: true });
      try {
        await generateLicensePDF(contractId);
        alert("Vertrag akzeptiert! PDF wurde per E-Mail versendet. ✅");
      } catch (pdfError) {
        console.error("Failed to generate PDF:", pdfError);
        alert("Vertrag akzeptiert, aber PDF-Generierung fehlgeschlagen.");
      }
      queryClient.invalidateQueries({
        queryKey: ["pendingContractsForVideo", video?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["contractsForVideo", video?.id],
      });
    } catch (e) {
      console.error("Failed to accept contract", e);
      alert("Fehler beim Akzeptieren.");
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
      queryClient.invalidateQueries({
        queryKey: ["pendingContractsForVideo", video?.id],
      });
    } catch (e) {
      console.error("Failed to delete contract", e);
    }
  };

  if (!isOpen) return null;

  const handleSearch = () => {
    if (videoUrl) findVideo(videoUrl);
  };

  const { isAdmin } = useAdmin();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isDebugRequested = queryParams.get("debug") === "true";
  const showDebugTools = isAdmin && isDebugRequested;

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

  const activeMainVideo = simulatedMainVideo || video;
  const activeFoundVideo = simulatedFoundVideo || foundVideo;

  const formatViews = (views: number) => {
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-4 md:inset-8 lg:inset-12 xl:inset-16 z-[70] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full max-w-6xl mx-auto bg-card rounded-2xl shadow-2xl border border-border/50 flex flex-col overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Scrollable Content – hidden scrollbar */}
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Compact Header: Thumbnail + Info side-by-side */}
            <div className="p-6 flex flex-col sm:flex-row gap-5">
              {/* Thumbnail */}
              <div className="shrink-0 w-full sm:w-64 md:w-80">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full aspect-video object-cover rounded-xl shadow-md"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Title & Badges */}
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {isLicensed && (
                    <Badge className="bg-green-500 text-white border-transparent text-xs px-2 py-0.5">
                      <Shield className="h-3 w-3 mr-1" /> Lizenz verfügbar
                    </Badge>
                  )}
                  {video.channel_title && (
                    <Badge variant="outline" className="text-xs">
                      {video.channel_title}
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl md:text-2xl font-bold leading-tight line-clamp-2">
                  {video.title}
                </h1>
                {video.yt_link && (
                  <a
                    href={video.yt_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-2 w-fit"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Auf YouTube ansehen
                  </a>
                )}
              </div>
            </div>

            {/* Stats Bar */}
            <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
              <div className="flex flex-wrap gap-4 md:gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="font-semibold">
                    {formatViews(activeMainVideo.last_view_count || 0)}
                  </span>
                  <span className="text-muted-foreground">Views</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{contracts.length}</span>
                  <span className="text-muted-foreground">
                    Lizenzen verkauft
                  </span>
                </div>
                {mode === "owner" && pendingContracts.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-yellow-500">
                      {pendingContracts.length}
                    </span>
                    <span className="text-muted-foreground">
                      Offene Anfragen
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation (Owner only) */}
            {mode === "owner" && (
              <div className="px-6 pt-4">
                <div className="inline-flex bg-muted/50 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === "details"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Details & Lizenz
                  </button>
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                      activeTab === "pending"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Anfragen
                    {pendingContracts.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {pendingContracts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="p-6">
              {/* ─── PENDING REQUESTS TAB ─── */}
              {mode === "owner" && activeTab === "pending" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Offene Lizenzanfragen
                  </h3>
                  {pendingContracts.length > 0 ? (
                    pendingContracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-yellow-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar circle */}
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {(contract.licensee_name?.[0] || "?").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {contract.licensee_name || "Unbekannt"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {contract.pricing_value}{" "}
                              {contract.pricing_currency} ·{" "}
                              {contract.pricing_model_type === 1
                                ? "Fixpreis"
                                : contract.pricing_model_type === 2
                                  ? "Pro View"
                                  : "CPM"}
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                              {new Date(contract.created_at).toLocaleDateString(
                                "de-DE",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          {processingIds.has(contract.id) ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleAccept(contract.id)}
                              >
                                <Check className="h-4 w-4 mr-1" /> Annehmen
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:flex-none border-red-500/50 text-red-500 hover:bg-red-500/10"
                                onClick={() => handleDelete(contract.id)}
                              >
                                <X className="h-4 w-4 mr-1" /> Ablehnen
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Keine offenen Anfragen</p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── DETAILS TAB ─── */}
              {(activeTab === "details" || mode !== "owner") && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column – Info */}
                  <div className="space-y-5">
                    {/* License Details */}
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Lizenz Details
                      </h3>
                      {mode === "owner" ? (
                        contracts.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground mb-2">
                              Lizenziert von:
                            </p>
                            {contracts.map((contract) => (
                              <div
                                key={contract.id}
                                className="flex items-center justify-between p-2.5 bg-background rounded-lg border border-border/30"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xs font-bold">
                                    {(
                                      contract.licensee_name?.[0] || "?"
                                    ).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium">
                                    {contract.licensee_name || "Unbekannt"}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    contract.created_at,
                                  ).toLocaleDateString("de-DE")}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Noch keine Lizenzen verkauft.
                          </p>
                        )
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm">
                            Creator:{" "}
                            <span className="font-medium">
                              {video.channel_title || "Unbekannt"}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contracts.length} Lizenzen vergeben
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Debug Tools */}
                    {showDebugTools && simulatedMainVideo && (
                      <ChangeVideoSettings
                        video={simulatedMainVideo}
                        handleViewsChange={handleMainViewsChange}
                        setMockViews={setMainMockViews}
                      />
                    )}
                  </div>

                  {/* Right Column – Actions */}
                  <div className="space-y-5">
                    {/* Owner: License Toggle + Link Video */}
                    {mode === "owner" && (
                      <>
                        {/* License Toggle */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            Video lizenzieren
                          </h3>
                          <Field orientation="horizontal" className="max-w-sm">
                            <FieldContent>
                              <FieldLabel htmlFor="switch-focus-mode">
                                Zur kommerziellen Nutzung freigeben
                              </FieldLabel>
                              <FieldDescription>
                                Andere können Reaktionen auf dieses Video
                                lizenzieren
                              </FieldDescription>
                            </FieldContent>
                            <Switch
                              onCheckedChange={(checked) => {
                                if (!checked) {
                                  // Video is currently licensed, user wants to unlicense -> show confirm
                                  setIsConfirmOpen(true);
                                } else {
                                  // Video is not licensed, user wants to license -> just do it
                                  toggleLicense();
                                }
                              }}
                              checked={isLicensed}
                            />

                            <ConfirmDialog
                              isOpen={isConfirmOpen}
                              onClose={() => setIsConfirmOpen(false)}
                              onConfirm={() => {
                                toggleLicense();
                              }}
                              title="Lizenzierung widerrufen"
                              description="Bist du sicher, dass du dieses Video nicht mehr zur Lizenzierung anbieten möchtest? Bestehende (bereits gekaufte) Lizenzen behalten ihre Gültigkeit."
                              isDestructive={true}
                              confirmLabel="Entlizenzieren"
                            />
                          </Field>
                        </div>

                        {/* Link Video */}
                        <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-primary" />
                            Original-Video verlinken
                          </h3>
                          <p className="text-xs text-muted-foreground mb-4">
                            Hast du auf ein Video reagiert? Suche nach dem
                            Original-Video, um zu prüfen, ob eine Lizenz
                            verfügbar ist, und erwerbe diese direkt für deine
                            Reaction.
                          </p>

                          <InputGroup className="max-w-full">
                            <InputGroupInput
                              placeholder="YouTube URL des Originals einfügen..."
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSearch();
                              }}
                            />
                            <InputGroupAddon>
                              <Search className="w-4 h-4" />
                            </InputGroupAddon>
                          </InputGroup>

                          <Button
                            className="w-full mt-3"
                            onClick={handleSearch}
                            disabled={isLoading || !videoUrl}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Suche...
                              </>
                            ) : (
                              <>
                                <Search className="h-4 w-4 mr-2" />
                                Video suchen
                              </>
                            )}
                          </Button>

                          {foundVideo && (
                            <div className="mt-4 space-y-3">
                              <VideoItem video={foundVideo} />
                              {showDebugTools && simulatedFoundVideo && (
                                <ChangeVideoSettings
                                  video={simulatedFoundVideo}
                                  handleViewsChange={handleFoundViewsChange}
                                  setMockViews={setFoundMockViews}
                                />
                              )}

                              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                <p className="text-sm font-medium mb-2">
                                  Lizenz für deine Reaction erwerben:
                                </p>
                                <BuyOptions
                                  videoCreator={activeFoundVideo}
                                  videoReactor={activeMainVideo}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Public: Full Info + Reaction Step + Buy Options */}
                    {mode === "public" && (
                      <div className="space-y-5">
                        {/* Creator Block */}
                        <div className="p-4 rounded-xl border border-border/50 bg-muted/20 flex items-center gap-4">
                          {creatorProfile?.youtube_channel_avatar ? (
                            <img
                              src={creatorProfile.youtube_channel_avatar}
                              alt={
                                creatorProfile.youtube_channel_title ||
                                "Creator"
                              }
                              className="w-14 h-14 rounded-full object-cover border-2 border-simple-purple/30 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-simple-purple/10 text-simple-purple flex items-center justify-center text-xl font-bold shrink-0">
                              {(video.channel_title?.[0] || "C").toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="font-semibold text-sm truncate">
                                {creatorProfile?.youtube_channel_title ||
                                  video.channel_title ||
                                  "Unbekannter Creator"}
                              </p>
                              <BadgeCheck className="h-4 w-4 text-simple-purple shrink-0" />
                            </div>
                            {creatorProfile?.subscriber_count != null && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {creatorProfile.subscriber_count.toLocaleString(
                                  "de-DE",
                                )}{" "}
                                Abonnenten
                              </p>
                            )}
                            <div className="flex gap-3 mt-2">
                              {creatorProfile?.youtube_channel_id && (
                                <a
                                  href={`https://www.youtube.com/channel/${creatorProfile.youtube_channel_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                                >
                                  <Youtube className="h-3.5 w-3.5" /> Kanal
                                  ansehen
                                </a>
                              )}
                              {creatorProfile?.id && (
                                <button
                                  onClick={() => {
                                    navigate(`/creator/${creatorProfile.id}`);
                                    onClose();
                                  }}
                                  className="flex items-center gap-1 text-xs text-simple-purple hover:underline"
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />{" "}
                                  SimpleShare-Profil
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Video Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-muted/20 border border-border/50 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                              <Eye className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Aufrufe
                              </p>
                              <p className="font-semibold text-sm">
                                {formatViews(video.last_view_count || 0)}
                              </p>
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/20 border border-border/50 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Lizenzen vergeben
                              </p>
                              <p className="font-semibold text-sm">
                                {contracts.length}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* YouTube Links */}
                        <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Links
                          </h3>
                          {video.yt_link && (
                            <a
                              href={video.yt_link}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors text-sm"
                            >
                              <Youtube className="h-4 w-4 text-red-500 shrink-0" />
                              <span className="flex-1 truncate font-medium">
                                Video auf YouTube ansehen
                              </span>
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            </a>
                          )}
                          {creatorProfile?.youtube_channel_id && (
                            <a
                              href={`https://www.youtube.com/channel/${creatorProfile.youtube_channel_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors text-sm"
                            >
                              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="flex-1 truncate font-medium">
                                {creatorProfile.youtube_channel_title ||
                                  "YouTube-Kanal"}
                              </span>
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            </a>
                          )}
                        </div>

                        {/* Separator */}
                        <div className="border-t border-border/50" />

                        {/* Step 1: Reaction Video */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                              1
                            </div>
                            <h3 className="text-sm font-semibold">
                              Welches deiner Videos ist die Reaction?
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground pl-8">
                            Der Lizenzpreis hängt von deinen Aufrufzahlen ab.
                          </p>

                          {/* Mode toggle */}
                          {user && (
                            <div className="pl-8 flex gap-2">
                              <button
                                onClick={() => {
                                  setReactionInputMode("mine");
                                  setSelectedMyVideo(null);
                                  setReactionStepDone(false);
                                }}
                                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                                  reactionInputMode === "mine"
                                    ? "bg-primary text-white border-primary"
                                    : "border-border text-muted-foreground hover:border-primary/50"
                                }`}
                              >
                                Aus meinen Videos wählen
                              </button>
                              <button
                                onClick={() => {
                                  setReactionInputMode("url");
                                  setSelectedMyVideo(null);
                                  setReactionStepDone(false);
                                }}
                                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                                  reactionInputMode === "url"
                                    ? "bg-primary text-white border-primary"
                                    : "border-border text-muted-foreground hover:border-primary/50"
                                }`}
                              >
                                YouTube-Link eingeben
                              </button>
                            </div>
                          )}

                          {/* Mode: Pick from own videos */}
                          {reactionInputMode === "mine" && user && (
                            <div className="space-y-2">
                              {isLoadingMyVideos ? (
                                <div className="flex items-center gap-2 text-muted-foreground text-xs pl-8">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                                  Videos werden geladen…
                                </div>
                              ) : myVideos.length === 0 ? (
                                <p className="text-xs text-muted-foreground pl-8">
                                  Keine eigenen Videos gefunden. Lade deine
                                  Videos unter "Meine Videos" hoch.
                                </p>
                              ) : (
                                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                                  {myVideos.map((v: any) => (
                                    <button
                                      key={v.id}
                                      onClick={() => {
                                        setSelectedMyVideo(v);
                                        setReactionStepDone(true);
                                      }}
                                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                                        selectedMyVideo?.id === v.id
                                          ? "border-primary bg-primary/5 text-foreground"
                                          : "border-border/50 hover:border-primary/40 hover:bg-muted/30 text-muted-foreground"
                                      }`}
                                    >
                                      {v.thumbnail && (
                                        <img
                                          src={v.thumbnail}
                                          alt={v.title}
                                          className="w-14 h-9 object-cover rounded shrink-0"
                                          referrerPolicy="no-referrer"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">
                                          {v.title}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                          {v.last_view_count
                                            ? `${(v.last_view_count / 1000).toFixed(1)}K Views`
                                            : "Keine Aufrufzahlen"}
                                        </p>
                                      </div>
                                      {selectedMyVideo?.id === v.id && (
                                        <Check className="h-4 w-4 text-primary shrink-0" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Mode: YouTube URL */}
                          {(reactionInputMode === "url" || !user) && (
                            <div className="space-y-2">
                              <InputGroup className="max-w-full">
                                <InputGroupInput
                                  placeholder="https://youtube.com/watch?v=..."
                                  value={reactionUrl}
                                  onChange={(e) => {
                                    setReactionUrl(e.target.value);
                                    setReactionStepDone(false);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && reactionUrl) {
                                      findReaction(reactionUrl);
                                      setReactionStepDone(true);
                                    }
                                  }}
                                />
                                <InputGroupAddon>
                                  <Search className="w-4 h-4" />
                                </InputGroupAddon>
                              </InputGroup>
                              <Button
                                className="w-full"
                                onClick={() => {
                                  if (reactionUrl) {
                                    findReaction(reactionUrl);
                                    setReactionStepDone(true);
                                  }
                                }}
                                disabled={isLoadingReaction || !reactionUrl}
                              >
                                {isLoadingReaction ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Suche...
                                  </>
                                ) : (
                                  <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Preis berechnen
                                  </>
                                )}
                              </Button>
                              {reactionVideo && reactionStepDone && (
                                <div className="mt-1 space-y-2">
                                  <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                                    <Check className="h-3.5 w-3.5" />{" "}
                                    Reaction-Video gefunden
                                  </p>
                                  <VideoItem video={reactionVideo} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Step 2: Buy Options */}
                        {((reactionInputMode === "mine" && selectedMyVideo) ||
                          (reactionInputMode === "url" &&
                            reactionVideo &&
                            reactionStepDone) ||
                          (!user && reactionVideo && reactionStepDone)) && (
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                2
                              </div>
                              <h3 className="text-sm font-semibold flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-primary" />
                                Lizenz erwerben
                              </h3>
                            </div>
                            <BuyOptions
                              videoCreator={activeMainVideo}
                              videoReactor={selectedMyVideo || reactionVideo}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
