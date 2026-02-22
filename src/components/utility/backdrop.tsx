import { use, useEffect } from "react";

interface BackdropProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Backdrop = ({ isOpen, onClose, children }: BackdropProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, [isOpen]);
  return isOpen ? (
    <div onClick={onClose}>
      <div
        className="backdrop fixed  backdrop-blur-sm w-full h-full bg-gray-500/10 absolute top-0 left-0 right-0 bottom-0  "
        onClick={onClose}
      />
      {children}
    </div>
  ) : null;
};
