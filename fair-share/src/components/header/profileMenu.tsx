import React, { useState } from "react";
import { handleLogout, handleLogin } from "../../hooks/auth/useHandleAuth";
import { SettingsModal } from "./settingsModal";
import { useNavigate } from "react-router-dom";

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const UserMenu = ({ isOpen, onClose, user }: UserMenuProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
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
                navigate("/profile");
              }}
            >
              Mein Profil
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
              onClick={() => setShowSettings(true)}
            >
              Einstellungen
            </button>
            <hr className="border-border my-2" />
            <button
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors text-sm font-medium"
              onClick={handleLogout}
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

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};
