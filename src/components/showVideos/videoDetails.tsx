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
  const [isVideoPickerOpen, setIsVideoPickerOpen] = useState(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState("");
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
  const activeContracts = contracts.filter(
    (c) => c.status === "PAID" || c.status === "ACTIVE",
  );

  // Check for existing license of the current user
  const myExistingLicense = activeContracts.find(
    (c) => c.licensee_id === user?.id,
  );

  const [licensedVideoMetadata, setLicensedVideoMetadata] = useState<{
    title: string;
    thumbnail: string;
  } | null>(null);

  useEffect(() => {
    if (myExistingLicense?.reaction_video_id) {
      // 1. Check local myVideos first
      const fromMine = myVideos?.find(
        (v) => v.id === myExistingLicense.reaction_video_id,
      );
      if (fromMine) {
        setLicensedVideoMetadata({
          title: fromMine.title,
          thumbnail: fromMine.thumbnail,
        });
      } else {
        // 2. Fetch from database as fallback
        import("@/services/supabaseCollum/client").then(({ supabase }) => {
          supabase
            .from("videos")
            .select("title, thumbnail")
            .eq("id", myExistingLicense.reaction_video_id)
            .maybeSingle()
            .then(({ data }) => {
              if (data) {
                setLicensedVideoMetadata({
                  title: data.title,
                  thumbnail: data.thumbnail,
                });
              }
            });
        });
      }
    } else {
      setLicensedVideoMetadata(null);
    }
  }, [myExistingLicense, myVideos]);

  const handleAccept = async (contractId: string) => {
    if (processingIds.has(contractId)) return;
    setProcessingIds((prev) => new Set(prev).add(contractId));
    try {
      await updateReactionContract(contractId, { accepted_by_licensor: true });
      try {
        await generateLicensePDF(contractId);
        alert("Vertrag akzeptiert! PDF wurde per E-Mail versendet.");
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

  const getHighResThumbnail = (video: any) => {
    if (!video) return "";
    const videoId = video.yt_id || video.id;
    if (!videoId || videoId.length > 20) return video.thumbnail; // Fallback if not a standard YT ID
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
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
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-background/80 hover:bg-accent hover:text-accent-foreground text-foreground border border-border shadow-sm transition-all backdrop-blur-md"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Scrollable Content - hidden scrollbar */}
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* PUBLIC: Side-by-Side Hero (Optimized) */}
            {mode === "public" && (
              <div className="flex flex-col md:flex-row bg-card overflow-hidden border-b border-border/50">
                {/* Thumbnail Column */}
                <div className="relative w-full md:w-[60%] lg:w-[65%] aspect-video md:aspect-auto md:h-[400px]">
                  <img
                    src={getHighResThumbnail(video)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback if maxresdefault doesn't exist
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes("hqdefault")) {
                        target.src = target.src.replace(
                          "maxresdefault",
                          "hqdefault",
                        );
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent md:hidden" />
                  {isLicensed && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-green-500 text-white border-transparent shadow-lg px-3 py-1 text-xs">
                        <Shield className="h-3 w-3 mr-1" /> Lizenz verfuegbar
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info Column */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center bg-card md:border-l md:border-border/10">
                  {video.channel_title && (
                    <p className="text-primary text-xs font-bold uppercase tracking-wider mb-2">
                      {video.channel_title}
                    </p>
                  )}
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-4">
                    {video.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Eye className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">
                          {formatViews(activeMainVideo.last_view_count || 0)}
                        </span>
                        <span className="text-[10px] uppercase tracking-tighter opacity-70">
                          Views
                        </span>
                      </div>
                    </div>

                    {activeContracts.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Users className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-green-500">
                            {activeContracts.length}
                          </span>
                          <span className="text-[10px] uppercase tracking-tighter text-green-500/70">
                            Lizenzen
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {video.yt_link && (
                    <div className="mt-8 pt-6 border-t border-border/50">
                      <a
                        href={video.yt_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Auf YouTube
                        ansehen
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OWNER: Compact Header */}
            {mode !== "public" && (
              <div className="p-6 flex flex-col sm:flex-row gap-5">
                <div className="shrink-0 w-full sm:w-64 md:w-80">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full aspect-video object-cover rounded-xl shadow-md"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {isLicensed && (
                      <Badge className="bg-green-500 text-white border-transparent text-xs px-2 py-0.5">
                        <Shield className="h-3 w-3 mr-1" /> Lizenz verfuegbar
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
                      <ExternalLink className="h-3.5 w-3.5" /> Auf YouTube
                      ansehen
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Stats Bar - Owner only */}
            {mode !== "public" && (
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
                    <span className="font-semibold">{activeContracts.length}</span>
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
            )}

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

            {/* PUBLIC MODE: Conversion-Optimized Layout */}
            {mode === "public" && (
              <div className="flex flex-col">
                {/* CONVERSION ZONE */}
                <div className="p-6 border-b border-border/50 space-y-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Gefuehrter Lizenz-Flow
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold mb-1">
                        Lizenz fuer deine Reaction starten
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Klar in 3 Schritten: Reaktionsvideo waehlen, Modell festlegen, Zustimmung bestaetigen.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md border border-border/50 bg-background/70 px-2.5 py-2">
                        1) Video waehlen
                      </div>
                      <div className="rounded-md border border-border/50 bg-background/70 px-2.5 py-2">
                        2) Preis-Modell
                      </div>
                      <div className="rounded-md border border-border/50 bg-background/70 px-2.5 py-2">
                        3) Zustimmung & Checkout
                      </div>
                    </div>
                  </div>
                  {user && !myExistingLicense && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setReactionInputMode("mine");
                          setIsVideoPickerOpen(true);
                        }}
                        className="rounded-xl font-semibold px-5"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" /> Lizenz starten
                      </Button>
                    </div>
                  )}
                  {/* ALREADY LICENSED UI */}
                  {user && myExistingLicense && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-bold text-emerald-600">
                            Bereits lizenziert
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500 text-white border-transparent px-2 py-0.5 text-[10px]"
                        >
                          {myExistingLicense.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 bg-background rounded-xl border border-emerald-500/10 shadow-sm">
                        {licensedVideoMetadata?.thumbnail ? (
                          <img
                            src={licensedVideoMetadata.thumbnail}
                            className="w-16 h-10 object-cover rounded-md border border-border/50"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-muted rounded-md flex items-center justify-center">
                            <Youtube className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                            Lizenziertes Video
                          </p>
                          <p className="text-sm font-bold truncate">
                            {licensedVideoMetadata?.title ||
                              myExistingLicense.reaction_video_id ||
                              "Video"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-1">
                        <p className="text-[10px] text-muted-foreground italic">
                          Lizenziert am{" "}
                          {new Date(
                            myExistingLicense.created_at,
                          ).toLocaleDateString("de-DE")}
                        </p>
                        <button
                          onClick={() => navigate("/dashboard")}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          Zum Dashboard <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Checkout Wizard Modal */}
                  {isVideoPickerOpen && user && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                      <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => {
                          setIsVideoPickerOpen(false);
                          setReactionStepDone(false);
                          setSelectedMyVideo(null);
                        }}
                      />
                      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-4 border-b border-border/50 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {reactionStepDone && (
                              <button
                                onClick={() => setReactionStepDone(false)}
                                className="p-1.5 hover:bg-muted rounded-full transition-colors"
                              >
                                <ArrowRight className="h-4 w-4 rotate-180" />
                              </button>
                            )}
                            <h3 className="font-bold shrink-0">
                              {reactionStepDone
                                ? "Preisvorschau"
                                : "Video auswaehlen"}
                            </h3>
                          </div>

                          {!reactionStepDone && (
                            <div className="relative flex-1 max-w-[180px]">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Suchen..."
                                value={videoSearchQuery}
                                onChange={(e) =>
                                  setVideoSearchQuery(e.target.value)
                                }
                                className="w-full bg-muted/50 border border-border/50 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                              />
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setIsVideoPickerOpen(false);
                              setReactionStepDone(false);
                              setSelectedMyVideo(null);
                            }}
                            className="p-1.5 hover:bg-muted rounded-full transition-colors shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 transition-colors">
                          {!reactionStepDone ? (
                            <div className="space-y-4">
                              {/* Select Mode Tags */}
                              <div className="flex gap-2 mb-4">
                                <button
                                  onClick={() => setReactionInputMode("mine")}
                                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${reactionInputMode === "mine" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                                >
                                  Meine Videos
                                </button>
                                <button
                                  onClick={() => setReactionInputMode("url")}
                                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${reactionInputMode === "url" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                                >
                                  YouTube-Link
                                </button>
                              </div>

                              {reactionInputMode === "mine" ? (
                                <>
                                  {isLoadingMyVideos ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                      <p className="text-sm">
                                        Videos werden geladen...
                                      </p>
                                    </div>
                                  ) : (myVideos || []).filter((v: any) =>
                                      v.title
                                        ?.toLowerCase()
                                        .includes(
                                          videoSearchQuery.toLowerCase(),
                                        ),
                                    ).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                                      <div className="p-4 rounded-full bg-muted">
                                        <Search className="h-8 w-8 text-muted-foreground opacity-20" />
                                      </div>
                                      <p className="text-sm text-muted-foreground max-w-[250px]">
                                        {videoSearchQuery
                                          ? `Keine Videos fuer "${videoSearchQuery}" gefunden.`
                                          : "Keine eigenen Videos gefunden."}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                      {(myVideos || [])
                                        .filter((v: any) =>
                                          v.title
                                            ?.toLowerCase()
                                            .includes(
                                              videoSearchQuery.toLowerCase(),
                                            ),
                                        )
                                        .map((v: any) => (
                                          <button
                                            key={v.id}
                                            onClick={() => {
                                              setSelectedMyVideo(v);
                                              setReactionStepDone(true);
                                              setVideoSearchQuery("");
                                            }}
                                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedMyVideo?.id === v.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/40 hover:bg-muted"}`}
                                          >
                                            {v.thumbnail && (
                                              <img
                                                src={v.thumbnail}
                                                alt={v.title}
                                                className="w-16 h-10 object-cover rounded-md shrink-0 border border-border/50"
                                                referrerPolicy="no-referrer"
                                              />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-semibold truncate text-foreground">
                                                {v.title}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {v.last_view_count
                                                  ? `${(v.last_view_count / 1000).toFixed(1)}K Aufrufe`
                                                  : "0 Aufrufe"}
                                              </p>
                                            </div>
                                          </button>
                                        ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="space-y-4 py-4">
                                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                      Direkt-Link
                                    </p>
                                    <div className="flex gap-2">
                                      <InputGroup className="flex-1">
                                        <InputGroupInput
                                          placeholder="YouTube Video-URL einfuegen..."
                                          value={reactionUrl}
                                          onChange={(e) =>
                                            setReactionUrl(e.target.value)
                                          }
                                        />
                                      </InputGroup>
                                      <Button
                                        onClick={() => {
                                          if (reactionUrl) {
                                            findReaction(reactionUrl);
                                            setReactionStepDone(true);
                                          }
                                        }}
                                        disabled={
                                          isLoadingReaction || !reactionUrl
                                        }
                                      >
                                        {isLoadingReaction ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          "Check"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                              {/* Selection Sync */}
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/30">
                                {(selectedMyVideo?.thumbnail ||
                                  reactionVideo?.thumbnail) && (
                                  <img
                                    src={
                                      selectedMyVideo?.thumbnail ||
                                      reactionVideo?.thumbnail
                                    }
                                    className="w-16 h-10 object-cover rounded-md shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] uppercase font-bold text-primary tracking-tighter">
                                    Ausgewaehltes Video
                                  </p>
                                  <p className="text-sm font-bold truncate">
                                    {selectedMyVideo?.title ||
                                      reactionVideo?.title}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setReactionStepDone(false)}
                                  className="text-xs text-primary hover:underline font-medium"
                                >
                                  Aendern
                                </button>
                              </div>

                              <div className="p-2">
                                <BuyOptions
                                  videoCreator={activeMainVideo}
                                  videoReactor={
                                    selectedMyVideo || reactionVideo
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        {!reactionStepDone && (
                          <div className="p-4 border-t border-border/50 bg-muted/20">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setIsVideoPickerOpen(false)}
                            >
                              Abbrechen
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {!isVideoPickerOpen && (
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/15 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold">Schneller 3-Schritt-Flow</p>
                      <p className="text-xs text-muted-foreground">
                        Starte oben mit "Lizenz starten" und folge dem Wizard fuer eine klare Checkout-Strecke.
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="h-8 px-4 font-bold border-primary/20 text-primary"
                    >
                      Fokus: Checkout
                    </Badge>
                  </div>
                )}
                {/* INFO GRID */}
                <div className="hidden md:grid p-6 grid-cols-1 md:grid-cols-2 gap-4 border-b border-border/50">
                  <div className="p-4 rounded-xl border border-border/50 bg-muted/20 flex items-center gap-4">
                    {creatorProfile?.youtube_channel_avatar ? (
                      <img
                        src={creatorProfile.youtube_channel_avatar}
                        alt={creatorProfile.youtube_channel_title || "Creator"}
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
                            "-"}
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
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" /> Lizenz-Details
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          className={
                            isLicensed
                              ? "bg-green-500 text-white border-transparent text-xs"
                              : "text-xs"
                          }
                        >
                          {isLicensed ? "Verfuegbar" : "Nicht verfuegbar"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Lizenzen vergeben
                        </span>
                        <span className="font-semibold">
                          {activeContracts.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Aufrufe</span>
                        <span className="font-semibold">
                          {formatViews(video.last_view_count || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECONDARY LINKS */}
                <div className="hidden md:flex px-6 py-4 flex-wrap gap-4">
                  {video.yt_link && (
                    <a
                      href={video.yt_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Youtube className="h-3.5 w-3.5" /> Video auf YouTube
                    </a>
                  )}
                  {creatorProfile?.youtube_channel_id && (
                    <a
                      href={`https://www.youtube.com/channel/${creatorProfile.youtube_channel_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Users className="h-3.5 w-3.5" /> YouTube-Kanal
                    </a>
                  )}
                  {creatorProfile?.id && (
                    <button
                      onClick={() => {
                        navigate(`/creator/${creatorProfile.id}`);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-simple-purple transition-colors"
                    >
                      <ArrowRight className="h-3.5 w-3.5" /> SimpleShare-Profil
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* OWNER MODE: Tabs + Grid */}
            {mode !== "public" && (
              <div className="p-6">
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
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                              {(
                                contract.licensee_name?.[0] || "?"
                              ).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {contract.licensee_name || "Unbekannt"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {contract.pricing_value}{" "}
                                {contract.pricing_currency} -{" "}
                                {contract.pricing_model_type === 1
                                  ? "Fixpreis"
                                  : contract.pricing_model_type === 2
                                    ? "Pro View"
                                    : "CPM"}
                              </p>
                              <p className="text-xs text-muted-foreground/60">
                                {new Date(
                                  contract.created_at,
                                ).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
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
                {activeTab === "details" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" /> Lizenz Details
                        </h3>
                        {activeContracts.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground mb-2">
                              Lizenziert von:
                            </p>
                            {activeContracts.map((contract) => (
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
                        )}
                      </div>
                      {showDebugTools && simulatedMainVideo && (
                        <ChangeVideoSettings
                          video={simulatedMainVideo}
                          handleViewsChange={handleMainViewsChange}
                          setMockViews={setMainMockViews}
                        />
                      )}
                    </div>
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" /> Video
                          lizenzieren
                        </h3>
                        <Field orientation="horizontal" className="max-w-sm">
                          <FieldContent>
                            <FieldLabel htmlFor="switch-focus-mode">
                              Zur kommerziellen Nutzung freigeben
                            </FieldLabel>
                            <FieldDescription>
                              Berechne deinen persoenlichen Lizenzpreis
                            </FieldDescription>
                          </FieldContent>
                          <Switch
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                setIsConfirmOpen(true);
                              } else {
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
                            description="Bist du sicher, dass du dieses Video nicht mehr zur Lizenzierung anbieten moechtest? Bestehende (bereits gekaufte) Lizenzen behalten ihre Gueltigkeit."
                            isDestructive={true}
                            confirmLabel="Entlizenzieren"
                          />
                        </Field>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-primary" />{" "}
                          Original-Video verlinken
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Hast du auf ein Video reagiert? Suche nach dem
                          Original-Video, um zu pruefen, ob eine Lizenz verfuegbar
                          ist.
                        </p>
                        <InputGroup className="max-w-full">
                          <InputGroupInput
                            placeholder="YouTube URL des Originals einfuegen..."
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
                                Lizenz fuer dein Video erwerben:
                              </p>
                              <BuyOptions
                                videoCreator={activeFoundVideo}
                                videoReactor={activeMainVideo}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
