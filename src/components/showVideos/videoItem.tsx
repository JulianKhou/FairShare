import { useToggle } from "../../hooks/useToggle";
import { VideoDetails } from "./videoDetails";
import { createPortal } from "react-dom";
import { Backdrop } from "../utility/backdrop";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Video } from "lucide-react";

export const VideoItem = ({
  video,
  userId,
}: {
  video: any;
  userId?: string;
}) => {
  const [imgError, setImgError] = useState(false);
  const {
    value: isMenuOpen,
    toggle: toggleMenu,
    close: closeMenu,
  } = useToggle();

  return (
    <>
      <div
        key={video.id}
        className="group flex flex-col w-full bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:cursor-pointer border border-transparent hover:border-simple-purple/30"
        onClick={() => toggleMenu()}
      >
        {/* Thumbnail Container */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {!video.thumbnail || imgError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 bg-secondary/20">
              <Video className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-xs font-medium">Kein Thumbnail</span>
            </div>
          ) : (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          )}

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Lizenziert Badge */}
          {userId === video.creator_id && video.islicensed && (
            <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-md shadow-sm border border-green-400/30">
              Lizenz verfügbar
            </div>
          )}

          {/* Views badge on hover (bottom left) */}
          {video.last_view_count && (
            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white/90 text-xs font-semibold bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                {video.last_view_count.toLocaleString()} Aufrufe
              </span>
            </div>
          )}

          {/* Price badge on thumbnail */}
          {video.price != null && (
            <div className="absolute bottom-2 right-2">
              <span className="text-xs font-bold bg-gradient-to-r from-simple-purple to-simple-teal text-white px-2.5 py-1 rounded-full shadow-lg">
                ab{" "}
                {Number(video.price).toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="flex flex-col p-3 gap-1.5">
          {/* Channel avatar + name row (only for public view) */}
          {userId !== video.creator_id && video.channel_title && (
            <Link
              to={`/creator/${video.creator_id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 group/link"
            >
              {video.channel_avatar ? (
                <img
                  src={video.channel_avatar}
                  alt={video.channel_title}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-simple-purple/20 flex items-center justify-center shrink-0">
                  <span className="text-[8px] font-bold text-simple-purple">
                    {video.channel_title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs text-muted-foreground/80 font-medium truncate group-hover/link:text-simple-purple transition-colors">
                {video.channel_title}
              </span>
            </Link>
          )}

          <h3
            className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-simple-purple transition-colors"
            title={video.title}
          >
            {video.title}
          </h3>

          {/* Views for non-owners (already shown on hover, show here too on mobile) */}
          {video.last_view_count && (
            <p className="text-muted-foreground text-xs font-medium md:hidden">
              {video.last_view_count.toLocaleString()} Aufrufe
            </p>
          )}
        </div>
      </div>

      {/* Modal */}
      {isMenuOpen &&
        createPortal(
          <Backdrop isOpen={isMenuOpen} onClose={closeMenu}>
            <VideoDetails
              video={video}
              isOpen={isMenuOpen}
              onClose={closeMenu}
              mode={userId === video.creator_id ? "owner" : "public"}
            />
          </Backdrop>,
          document.getElementById("modal-root")!,
        )}
    </>
  );
};
