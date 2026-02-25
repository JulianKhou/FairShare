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
        className="group flex flex-col w-full bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:cursor-pointer border border-transparent hover:border-primary/20"
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
          
          {/* Lizenziert Badge */}
          {userId === video.creator_id && video.islicensed && (
            <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-md shadow-sm border border-green-400/30">
              Lizenz verfügbar
            </div>
          )}
        </div>
        
        {/* Info Box */}
        <div className="flex flex-col p-3 gap-1">
          <h3 
            className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors"
            title={video.title}
          >
            {video.title}
          </h3>
          {userId !== video.creator_id && video.channel_title && (
            <Link 
              to={`/creator/${video.creator_id}`}
              onClick={(e) => e.stopPropagation()}
              className="group/link text-xs text-muted-foreground/80 font-medium truncate hover:text-primary transition-colors flex items-center gap-1"
            >
              {video.channel_title}
            </Link>
          )}
          <p className="text-muted-foreground text-xs font-medium">
            {video.last_view_count?.toLocaleString()} Aufrufe
          </p>
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
