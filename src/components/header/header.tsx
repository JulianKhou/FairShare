import { SimpleShareLogo } from "../ui/simpleShareLogo.tsx";
import lupe from "../../assets/lupeIcon.svg";
import ProfileIcon from "./profileIcon";
import { UserMenu } from "./profileMenu";
import { useToggle } from "../../hooks/useToggle.ts";
import { useAuth } from "../../hooks/auth/useAuth";
import { NavLink } from "react-router-dom";
import { Switch } from "../ui/switch";
import { useToggleDarkmode } from "../../lib/useToggleDarkmode.ts";
import { IconMoon, IconSun, IconX } from "@tabler/icons-react";
import { NotificationBell } from "./NotificationBell";
import {
  getProfile,
  isProfileComplete,
  Profile,
  updateProfile,
} from "../../services/supabaseCollum/profiles.ts";
import { useEffect, useState } from "react";
import { fetchChannelData } from "../../services/youtube";
import { OnboardingModal } from "../profile/OnboardingModal";

function Header() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      getProfile(user.id).then(async (profile) => {
        setUserProfile(profile);

        // Check onboarding trigger
        if (profile && !isProfileComplete(profile)) {
          if (
            localStorage.getItem(`simpleshare_onboarding_done_${user.id}`) !==
            "true"
          ) {
            setShowOnboarding(true);
          }
        }

        // Auto-fetch channel data if missing
        if (profile && !profile.youtube_channel_id) {
          const channelData = await fetchChannelData();
          if (channelData) {
            await updateProfile(user.id, {
              youtube_channel_id: channelData.id,
              subscriber_count: channelData.subscriberCount,
            });
            // Update local state to remove warning if this was the only missing field
            setUserProfile((prev) =>
              prev
                ? {
                    ...prev,
                    youtube_channel_id: channelData.id,
                    subscriber_count: channelData.subscriberCount,
                  }
                : null,
            );
          }
        }
      });
    }
  }, [user]);

  const {
    value: isMenuOpen,
    toggle: toggleMenu,
    close: closeMenu,
  } = useToggle();
  const { isDarkMode, toggleDarkMode } = useToggleDarkmode();

  // Gemeinsame Styles für alle Nav-Links
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center h-full px-2 border-b-2 transition-colors ${
      isActive
        ? "border-primary text-primary"
        : "border-transparent text-card-foreground bg-background hover:text-primary hover:border-primary"
    }`;

  return (
    <header className="flex justify-between bg-background px-4 h-20 items-center fixed top-0 left-0 right-0 shadow-md z-50">
      {/* Logo Sektion */}
      <NavLink
        to="/"
        className="flex gap-4 items-center hover:opacity-80 transition-opacity"
      >
        <SimpleShareLogo size={40} />
        <h1 className="text-2xl font-bold tracking-tight">
          Simple<span className="text-simple-purple">Share</span>
        </h1>
      </NavLink>
      {userProfile &&
        !isProfileComplete(userProfile) &&
        isWarningVisible &&
        !showOnboarding && (
          <div className="hidden lg:flex fixed top-20 left-0 right-0 bg-yellow-100 border-b border-yellow-200 text-yellow-800 px-4 py-2 justify-center items-center gap-2 z-40 text-sm">
            <span>
              Your profile is incomplete. Please update it to use all features.
            </span>
            <NavLink to="/profile" className="font-semibold underline">
              Complete Profile
            </NavLink>
            <button
              onClick={() => setIsWarningVisible(false)}
              className="absolute right-4 p-1 hover:bg-yellow-200 rounded-full transition-colors"
            >
              <IconX size={16} />
            </button>
          </div>
        )}

      {/* Navigation */}
      <nav className="flex gap-8 h-full">
        {user && (
          <NavLink to="/dashboard" className={navLinkClasses}>
            Dashboard
          </NavLink>
        )}
        <NavLink to="/overview" className={navLinkClasses}>
          Übersicht
        </NavLink>
        <NavLink to="/my-channel" className={navLinkClasses}>
          Mein Kanal
        </NavLink>
      </nav>

      {/* Suche */}
      <div className="flex gap-2 items-center bg-white/5 rounded-full px-4 py-1 border border-white/10 focus-within:border-simple-teal/50 transition-all">
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none text-sm w-48 lg:w-64 h-8"
        />
        <button className="opacity-70 hover:opacity-100 transition-opacity">
          <img src={lupe} alt="search" className="w-5 h-5" />
        </button>
      </div>

      {/* Profil Bereich */}
      <div className="relative flex gap-2 items-center">
        <div className="flex gap-2 items-center">
          {isDarkMode ? <IconMoon size={20} /> : <IconSun size={20} />}
          <Switch onCheckedChange={toggleDarkMode} checked={isDarkMode} />
        </div>
        {user && <NotificationBell />}
        <button
          className="flex items-center justify-center p-1 rounded-full hover:bg-white/5 transition-colors"
          onClick={toggleMenu}
        >
          <ProfileIcon />
        </button>
        {/* Das Menü sollte absolut zum Button positioniert sein */}
        <UserMenu
          isOpen={isMenuOpen}
          onClose={closeMenu}
          user={user}
          userProfile={userProfile}
        />
      </div>

      {user && (
        <OnboardingModal
          userProfile={userProfile}
          isOpen={showOnboarding}
          onOpenChange={setShowOnboarding}
          userId={user.id}
          onComplete={() => {
            // Re-fetch profile to update local state after onboarding
            getProfile(user.id).then(setUserProfile);
          }}
        />
      )}
    </header>
  );
}

export default Header;
