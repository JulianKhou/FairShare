import { useToggle } from "../../hooks/useToggle";
import { VideoDetails } from "./videoDetails";
import { createPortal } from "react-dom";
import { Backdrop } from "../utility/backdrop";
const videoClasses =
  "video-item flex flex-col items-center min-w-[200px]  w-52 h-52 rounded-2xl";
const videoClassesHover =
  "hover:bg-accent transition-colors hover:cursor-pointer";
const imgClasses = "w-48 h-40 object-cover rounded-2xl p-2";
export const VideoItem = ({
  video,
  userId,
}: {
  video: any;
  userId?: string;
}) => {
  const {
    value: isMenuOpen,
    toggle: toggleMenu,
    close: closeMenu,
  } = useToggle();
  return (
    <div
      key={video.id}
      className={videoClasses + " " + videoClassesHover}
      onClick={() => toggleMenu()}
    >
      <div className="relative">
        <img
          src={video.thumbnail}
          alt={video.title}
          className={imgClasses}
          referrerPolicy="no-referrer"
        />
        {userId === video.creator_id && video.islicensed && (
          <span className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow">
            Lizenziert
          </span>
        )}
      </div>
      <h3 className="text-foreground self-start ml-3">{video.title}</h3>
      <h2 className="text-muted-foreground self-start text-xs ml-3">
        {video.last_view_count} Views
      </h2>
      <div>
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
      </div>

      {/* Add more video details here if needed */}
    </div>
  );
};
