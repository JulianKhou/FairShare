import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconSearch,
  IconVideo,
  IconUsers,
  IconSettings,
  IconHome,
  IconInfoCircle,
  IconChartBar,
  IconVideo as IconMyVideo,
  IconArrowRight,
  IconX,
  IconCommand,
  IconBrandYoutube,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import { useCreators } from "../../hooks/queries/useCreators";
import { useVideos } from "../../hooks/youtube/useVideos";
import { createPortal } from "react-dom";
import { supabase } from "../../services/supabaseCollum/client";

// --- YouTube URL Helpers ---
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtube.com" ||
      u.hostname === "m.youtube.com"
    ) {
      return u.searchParams.get("v");
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("?")[0] || null;
    }
  } catch {
    // not a valid URL
  }
  return null;
}

function isYouTubeUrl(str: string) {
  return (
    str.includes("youtube.com/watch") ||
    str.includes("youtu.be/") ||
    str.includes("youtube.com/shorts/")
  );
}

// --- Static pages / settings ---
const STATIC_ITEMS = [
  {
    id: "page-home",
    type: "page" as const,
    label: "Startseite",
    description: "Zurück zur Startseite",
    path: "/",
    icon: IconHome,
  },
  {
    id: "page-overview",
    type: "page" as const,
    label: "Übersicht",
    description: "Alle lizenzierten Videos",
    path: "/overview",
    icon: IconVideo,
  },
  {
    id: "page-how-it-works",
    type: "page" as const,
    label: "So funktioniert's",
    description: "Wie SimpleShare funktioniert",
    path: "/how-it-works",
    icon: IconInfoCircle,
  },
  {
    id: "page-dashboard",
    type: "page" as const,
    label: "Dashboard",
    description: "Deine Einnahmen & Aktivitäten",
    path: "/dashboard",
    icon: IconChartBar,
  },
  {
    id: "page-my-channel",
    type: "page" as const,
    label: "Meine Videos",
    description: "Deine hochgeladenen Videos",
    path: "/my-channel",
    icon: IconMyVideo,
  },
  {
    id: "settings-profile",
    type: "settings" as const,
    label: "Einstellungen → Profil",
    description: "Profil & Kanaleinstellungen",
    path: "/settings",
    icon: IconSettings,
  },
  {
    id: "settings-payments",
    type: "settings" as const,
    label: "Einstellungen → Zahlungen",
    description: "Stripe & Auszahlungen",
    path: "/settings#payments",
    icon: IconSettings,
  },
  {
    id: "settings-notifications",
    type: "settings" as const,
    label: "Einstellungen → Benachrichtigungen",
    description: "Push & E-Mail Einstellungen",
    path: "/settings#notifications",
    icon: IconSettings,
  },
];

const TYPE_LABELS: Record<string, string> = {
  video: "Videos",
  channel: "Kanäle",
  page: "Seiten",
  settings: "Einstellungen",
};

const TYPE_ORDER = ["video", "channel", "page", "settings"];

type YtLookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; video: any }
  | { status: "not_found"; videoId: string };

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [ytLookup, setYtLookup] = useState<YtLookupState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: creators = [] } = useCreators();
  const { videos = [] } = useVideos("licensed", undefined);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setYtLookup({ status: "idle" });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // YouTube URL detection + Supabase lookup
  useEffect(() => {
    const trimmed = query.trim();
    if (!isYouTubeUrl(trimmed)) {
      setYtLookup({ status: "idle" });
      return;
    }

    const videoId = extractYouTubeId(trimmed);
    if (!videoId) {
      setYtLookup({ status: "idle" });
      return;
    }

    setYtLookup({ status: "loading" });
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("youtube_video_id", videoId)
        .maybeSingle();

      if (error || !data) {
        setYtLookup({ status: "not_found", videoId });
      } else {
        setYtLookup({ status: "found", video: data });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const allItems = useCallback(() => {
    const q = query.toLowerCase().trim();
    if (!q || isYouTubeUrl(q)) return [];

    const videoMatches = videos
      .filter(
        (v) =>
          v.title?.toLowerCase().includes(q) ||
          v.channel_title?.toLowerCase().includes(q),
      )
      .slice(0, 4)
      .map((v) => ({
        id: `video-${v.id}`,
        type: "video" as const,
        label: v.title,
        description: v.channel_title || "Unbekannter Kanal",
        path: `/overview`,
        thumbnail: v.thumbnail,
        icon: IconVideo,
        data: v,
      }));

    const channelMatches = creators
      .filter((c) => c.youtube_channel_title?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((c) => ({
        id: `channel-${c.id}`,
        type: "channel" as const,
        label: c.youtube_channel_title || "Unbekannter Kanal",
        description: `${c.subscriber_count?.toLocaleString() || "?"} Abonnenten`,
        path: `/creator/${c.id}`,
        thumbnail: c.youtube_channel_avatar,
        icon: IconUsers,
        data: c,
      }));

    const staticMatches = STATIC_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    );

    return [...videoMatches, ...channelMatches, ...staticMatches];
  }, [query, videos, creators]);

  const results = allItems();
  const grouped = TYPE_ORDER.reduce<Record<string, typeof results>>(
    (acc, type) => {
      const items = results.filter((r) => r.type === type);
      if (items.length > 0) acc[type] = items;
      return acc;
    },
    {},
  );
  const flatResults = Object.values(grouped).flat();

  const handleSelect = (item: (typeof flatResults)[0]) => {
    navigate(item.path);
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && flatResults[activeIndex]) {
        handleSelect(flatResults[activeIndex]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, flatResults, activeIndex]);

  useEffect(() => setActiveIndex(0), [query]);

  if (!isOpen) return null;

  const isYtMode = isYouTubeUrl(query.trim());
  let flatIndex = 0;

  return createPortal(
    <div
      className="fixed inset-0 z-200 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          {isYtMode ? (
            <IconBrandYoutube size={18} className="text-red-500 shrink-0" />
          ) : (
            <IconSearch size={18} className="text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Videos, Kanäle, Einstellungen – oder YouTube-Link eingeben…"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconX size={16} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 text-muted-foreground text-xs border border-border px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {/* YouTube URL mode */}
          {isYtMode ? (
            <div className="p-5">
              {ytLookup.status === "loading" && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 rounded-full border-2 border-muted border-t-simple-purple animate-spin" />
                  <span className="text-sm">Lizenzstatus wird geprüft…</span>
                </div>
              )}

              {ytLookup.status === "found" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-green-500">
                    <IconCircleCheck size={22} />
                    <span className="font-semibold text-sm">
                      Dieses Video ist auf SimpleShare lizenziert!
                    </span>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                    {ytLookup.video.thumbnail && (
                      <img
                        src={ytLookup.video.thumbnail}
                        alt={ytLookup.video.title}
                        className="w-24 h-14 object-cover rounded-lg shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground line-clamp-2">
                        {ytLookup.video.title}
                      </p>
                      {ytLookup.video.channel_title && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {ytLookup.video.channel_title}
                        </p>
                      )}
                      {ytLookup.video.price != null && (
                        <p className="text-xs font-bold text-simple-purple mt-2">
                          Lizenzpreis: ~
                          {Number(ytLookup.video.price).toLocaleString(
                            "de-DE",
                            {
                              style: "currency",
                              currency: "EUR",
                            },
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {ytLookup.video.id && (
                    <button
                      className="text-xs text-simple-purple underline self-start"
                      onClick={() => {
                        navigate(`/overview`);
                        onClose();
                      }}
                    >
                      In der Übersicht ansehen →
                    </button>
                  )}
                </div>
              )}

              {ytLookup.status === "not_found" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IconCircleX size={22} className="text-red-400" />
                    <span className="font-semibold text-sm">
                      Dieses Video ist noch nicht auf SimpleShare lizenziert.
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-8">
                    Der Creator kann sein Video unter{" "}
                    <strong className="text-foreground">Meine Videos</strong>{" "}
                    zur Lizenzierung freigeben.
                  </p>
                </div>
              )}

              {ytLookup.status === "idle" && (
                <p className="text-sm text-muted-foreground">
                  YouTube-Link erkannt – Suche läuft…
                </p>
              )}
            </div>
          ) : query.trim() === "" ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <IconSearch size={32} className="opacity-30" />
              <p className="text-sm">Tippe um zu suchen…</p>
              <p className="text-xs text-muted-foreground/60">
                Oder YouTube-Link einfügen, um den Lizenzstatus zu prüfen
              </p>
              <div className="flex items-center gap-2 text-xs opacity-50">
                <kbd className="border border-border px-1.5 py-0.5 rounded flex items-center gap-1">
                  <IconCommand size={10} /> K
                </kbd>
                zum Öffnen · <span>↑↓ navigieren</span> ·{" "}
                <span>Enter öffnen</span>
              </div>
            </div>
          ) : flatResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <p className="text-sm">Keine Ergebnisse für "{query}"</p>
            </div>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    {TYPE_LABELS[type]}
                  </span>
                </div>

                {items.map((item) => {
                  const isCurrent = flatResults.indexOf(item) === activeIndex;
                  const itemFlatIndex = flatIndex++;

                  return (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isCurrent
                          ? "bg-simple-purple/15 text-foreground"
                          : "hover:bg-muted/50 text-muted-foreground"
                      }`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(itemFlatIndex)}
                    >
                      {(item as any).thumbnail ? (
                        <img
                          src={(item as any).thumbnail}
                          alt={item.label}
                          className={`shrink-0 object-cover bg-muted ${
                            item.type === "channel"
                              ? "w-9 h-9 rounded-full"
                              : "w-12 h-8 rounded-md"
                          }`}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            item.type === "settings"
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-simple-purple/15 text-simple-purple"
                          }`}
                        >
                          <item.icon size={17} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${isCurrent ? "text-foreground" : ""}`}
                        >
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </p>
                      </div>

                      <IconArrowRight
                        size={14}
                        className={`shrink-0 transition-opacity ${isCurrent ? "opacity-80" : "opacity-0"}`}
                      />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
