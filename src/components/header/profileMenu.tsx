import { useState } from "react";
import { handleLogout, handleLogin } from "../../hooks/auth/useHandleAuth";
import { useNavigate } from "react-router-dom";
import { HelpRequestModal } from "../profile/HelpRequestModal";
import { useUnreadAdminReplies } from "@/hooks/support/useUnreadAdminReplies";

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userProfile?: any;
  onOpenOnboarding?: () => void;
}

export const UserMenu = ({
  isOpen,
  onClose,
  user,
  userProfile,
  onOpenOnboarding,
}: UserMenuProps) => {
  const navigate = useNavigate();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { unreadCount } = useUnreadAdminReplies(isHelpOpen);

  if (!isOpen && !isHelpOpen) return null;

  return (
    <>
      <HelpRequestModal isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />

      {isOpen && (
        <>
          {/* Backdrop: Schließt das Menu, wenn man daneben klickt */}
          <div className="fixed inset-0 z-40" onClick={onClose} />

          {/* Das eigentliche Popup */}
          <div className="absolute top-14 right-4 w-64 bg-popover border border-border rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 p-2">
              <img
                src={
                  user?.user_metadata?.avatar_url ||
                  "../../assets/profileCircle.svg"
                }
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border-2 border-gray-500"
              />
              <div>
                <p className="text-sm font-bold">
                  {user?.user_metadata?.full_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            {user ? (
              <div className="space-y-1">
                <button
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
                  onClick={() => {
                    onClose();
                    navigate("/dashboard");
                  }}
                >
                  Dashboard
                </button>
                {userProfile?.is_admin && (
                  <>
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold mb-2"
                      onClick={() => {
                        onClose();
                        navigate("/admin");
                      }}
                    >
                      Admin Panel
                    </button>
                    {onOpenOnboarding && (
                      <button
                        className="w-full text-left px-3 py-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors text-sm font-semibold mb-2"
                        onClick={() => {
                          onClose();
                          onOpenOnboarding();
                        }}
                      >
                        [Debug] Onboarding
                      </button>
                    )}
                  </>
                )}
                <button
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
                  onClick={() => {
                    onClose();
                    navigate("/settings");
                  }}
                >
                  Einstellungen
                </button>
                <button
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm flex items-center justify-between"
                  onClick={() => {
                    setIsHelpOpen(true);
                    onClose();
                  }}
                >
                  <span>Hilfe &amp; Support</span>
                  {unreadCount > 0 && (
                    <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                <hr className="border-border my-2" />
                <button
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors text-sm font-medium"
                  onClick={async () => {
                    await handleLogout();
                    onClose();
                    navigate("/");
                  }}
                >
                  Abmelden
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <button
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
                  onClick={handleLogin}
                >
                  Anmelden
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};
