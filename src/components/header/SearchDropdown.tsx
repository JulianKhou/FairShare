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
  IconBrandYoutube,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import { useCreators } from "../../hooks/queries/useCreators";
import { useVideos } from "../../hooks/youtube/useVideos";
import { supabase } from "../../services/supabaseCollum/client";

// --- YouTube URL helpers ---
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (
      ["www.youtube.com", "youtube.com", "m.youtube.com"].includes(u.hostname)
    ) {
      return (
        u.searchParams.get("v") ||
        u.pathname.split("/shorts/")[1]?.split("?")[0] ||
        null
      );
    }
    if (u.hostname === "youtu.be")
      return u.pathname.slice(1).split("?")[0] || null;
  } catch {
    /* not a URL */
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

// --- Static entries ---
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
    id: "page-hiw",
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
    id: "settings-p",
    type: "settings" as const,
    label: "Einstellungen → Profil",
    description: "Profil & Kanaleinstellungen",
    path: "/settings",
    icon: IconSettings,
  },
  {
    id: "settings-pay",
    type: "settings" as const,
    label: "Einstellungen → Zahlungen",
    description: "Stripe & Auszahlungen",
    path: "/settings#payments",
    icon: IconSettings,
  },
  {
    id: "settings-notif",
    type: "settings" as const,
    label: "Einstellungen → Benachricht.",
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

type YtState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; video: any }
  | { status: "not_found" };

export function SearchDropdown() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ytState, setYtState] = useState<YtState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: creators = [] } = useCreators();
  const { videos = [] } = useVideos("licensed", undefined);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Ctrl+K focuses the input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // YouTube URL detection
  useEffect(() => {
    const trimmed = query.trim();
    if (!isYouTubeUrl(trimmed)) {
      setYtState({ status: "idle" });
      return;
    }
    const videoId = extractYouTubeId(trimmed);
    if (!videoId) {
      setYtState({ status: "idle" });
      return;
    }
    setYtState({ status: "loading" });
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("videos")
        .select("*")
        .eq("youtube_video_id", videoId)
        .maybeSingle();
      setYtState(
        data ? { status: "found", video: data } : { status: "not_found" },
      );
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const getResults = useCallback(() => {
    const q = query.toLowerCase().trim();
    if (!q || isYouTubeUrl(q)) return [];
    const videoMatches = videos
      .filter(
        (v) =>
          v.title?.toLowerCase().includes(q) ||
          v.channel_title?.toLowerCase().includes(q),
      )
      .slice(0, 3)
      .map((v) => ({
        id: `video-${v.id}`,
        type: "video" as const,
        label: v.title,
        description: v.channel_title || "",
        path: "/overview",
        thumbnail: v.thumbnail,
        icon: IconVideo,
      }));
    const channelMatches = creators
      .filter((c) => c.youtube_channel_title?.toLowerCase().includes(q))
      .slice(0, 2)
      .map((c) => ({
        id: `ch-${c.id}`,
        type: "channel" as const,
        label: c.youtube_channel_title || "",
        description: `${c.subscriber_count?.toLocaleString() || "?"} Abonnenten`,
        path: `/creator/${c.id}`,
        thumbnail: c.youtube_channel_avatar,
        icon: IconUsers,
      }));
    const staticMatches = STATIC_ITEMS.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q),
    );
    return [...videoMatches, ...channelMatches, ...staticMatches];
  }, [query, videos, creators]);

  const results = getResults();
  const grouped = TYPE_ORDER.reduce<Record<string, typeof results>>(
    (acc, type) => {
      const items = results.filter((r) => r.type === type);
      if (items.length) acc[type] = items;
      return acc;
    },
    {},
  );
  const flat = Object.values(grouped).flat();

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && flat[activeIndex])
        handleSelect(flat[activeIndex].path);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flat, activeIndex]);

  useEffect(() => setActiveIndex(0), [query]);

  const isYtMode = isYouTubeUrl(query.trim());
  const showDropdown = open && query.trim().length > 0;
  let flatIndex = 0;

  return (
    <div ref={containerRef} className="relative hidden md:block">
      {/* Input */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all bg-muted/50 ${
          open
            ? "border-simple-purple/50 ring-2 ring-simple-purple/15 w-64 lg:w-72"
            : "border-border w-48 lg:w-60 hover:border-simple-purple/30"
        }`}
      >
        {isYtMode ? (
          <IconBrandYoutube size={15} className="text-red-500 shrink-0" />
        ) : (
          <IconSearch size={15} className="text-muted-foreground shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Suche… (Strg+K)"
          className="bg-transparent outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground min-w-0"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50">
          {/* YouTube mode */}
          {isYtMode ? (
            <div className="p-4">
              {ytState.status === "loading" && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div className="w-4 h-4 rounded-full border-2 border-muted border-t-simple-purple animate-spin" />
                  Lizenzstatus wird geprüft…
                </div>
              )}
              {ytState.status === "found" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-green-500 text-sm font-semibold">
                    <IconCircleCheck size={18} /> Lizenziert auf SimpleShare!
                  </div>
                  <div className="flex gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                    {ytState.video.thumbnail && (
                      <img
                        src={ytState.video.thumbnail}
                        alt={ytState.video.title}
                        className="w-20 h-12 object-cover rounded shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground line-clamp-2">
                        {ytState.video.title}
                      </p>
                      {ytState.video.price != null && (
                        <p className="text-xs text-simple-purple font-bold mt-1">
                          ~
                          {Number(ytState.video.price).toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    className="text-xs text-simple-purple underline text-left"
                    onClick={() => handleSelect("/overview")}
                  >
                    In der Übersicht ansehen →
                  </button>
                </div>
              )}
              {ytState.status === "not_found" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <IconCircleX size={18} className="text-red-400" /> Noch
                    nicht auf SimpleShare lizenziert.
                  </div>
                  <p className="text-xs text-muted-foreground pl-7">
                    Der Creator kann es unter "Meine Videos" freigeben.
                  </p>
                </div>
              )}
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Keine Ergebnisse für "{query}"
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <div className="px-3 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {TYPE_LABELS[type]}
                    </span>
                  </div>
                  {items.map((item) => {
                    const isCurrent = flat.indexOf(item) === activeIndex;
                    const idx = flatIndex++;
                    return (
                      <button
                        key={item.id}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isCurrent ? "bg-simple-purple/10 text-foreground" : "hover:bg-muted/60 text-muted-foreground"}`}
                        onClick={() => handleSelect(item.path)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        {(item as any).thumbnail ? (
                          <img
                            src={(item as any).thumbnail}
                            alt={item.label}
                            className={`shrink-0 object-cover bg-muted ${item.type === "channel" ? "w-7 h-7 rounded-full" : "w-10 h-7 rounded"}`}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.type === "settings" ? "bg-orange-500/10 text-orange-400" : "bg-simple-purple/15 text-simple-purple"}`}
                          >
                            <item.icon size={14} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                        <IconArrowRight
                          size={12}
                          className={`shrink-0 ${isCurrent ? "opacity-60" : "opacity-0"}`}
                        />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
