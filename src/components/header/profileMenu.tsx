import { useState } from "react";
import { handleLogout, handleLogin } from "../../hooks/auth/useHandleAuth";
import { useNavigate } from "react-router-dom";
import { HelpRequestModal } from "../profile/HelpRequestModal";

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
                  "../../assets/profile-circle-svgrepo-com.svg"
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
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
                  onClick={() => {
                    setIsHelpOpen(true);
                    onClose(); // Close the menu, but the modal stays open because of the condition
                  }}
                >
                  Hilfe & Support
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
