import { SimpleShareLogo } from "../ui/simpleShareLogo.tsx";
import lupe from "../../assets/lupeIcon.svg";
import ProfileIcon from "./profileIcon";
import { UserMenu } from "./profileMenu";
import { useToggle } from "../../hooks/useToggle.ts";
import { useAuth } from "../../hooks/auth/useAuth";
import { NavLink } from "react-router-dom";
import { Switch } from "../ui/switch";
import { useToggleDarkmode } from "../../lib/useToggleDarkmode.ts";
import { IconMoon, IconSun, IconX, IconMenu2 } from "@tabler/icons-react";
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
import { toast } from "sonner";

function Header() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        if (
          profile &&
          (!profile.youtube_channel_id ||
            !profile.youtube_channel_title ||
            !profile.youtube_channel_avatar)
        ) {
          const channelData = await fetchChannelData();
          if (channelData) {
            await updateProfile(user.id, {
              youtube_channel_id: channelData.id,
              youtube_channel_title: channelData.title,
              youtube_channel_avatar: channelData.avatar,
              subscriber_count: channelData.subscriberCount,
            });
            // Update local state to remove warning if this was the only missing field
            setUserProfile((prev) =>
              prev
                ? {
                    ...prev,
                    youtube_channel_id: channelData.id,
                    youtube_channel_title: channelData.title,
                    youtube_channel_avatar: channelData.avatar,
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
    <header className="flex justify-between bg-background px-4 h-16 md:h-20 items-center fixed top-0 left-0 right-0 shadow-md z-50">
      {/* Logo Sektion */}
      <NavLink
        to="/"
        className="flex gap-2 md:gap-4 items-center hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
          <SimpleShareLogo size={40} />
        </div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
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

      {/* Navigation - Desktop */}
      <nav className="hidden md:flex gap-8 h-full">
        <NavLink to="/how-it-works" className={navLinkClasses}>
          So funktioniert's
        </NavLink>
        <NavLink to="/overview" className={navLinkClasses}>
          Übersicht
        </NavLink>
        {user ? (
          <NavLink to="/my-channel" className={navLinkClasses}>
            Meine Videos
          </NavLink>
        ) : (
          <button
            onClick={() =>
              toast.info("Bitte logge dich ein, um deine Videos zu sehen.")
            }
            className={navLinkClasses({ isActive: false })}
          >
            Meine Videos
          </button>
        )}
        {user && (
          <NavLink to="/dashboard" className={navLinkClasses}>
            Dashboard
          </NavLink>
        )}
      </nav>

      {/* Suche - Desktop */}
      <div className="hidden md:flex gap-2 items-center bg-white/5 rounded-full px-4 py-1 border border-white/10 focus-within:border-simple-teal/50 transition-all">
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none text-sm w-48 lg:w-64 h-8"
        />
        <button className="opacity-70 hover:opacity-100 transition-opacity">
          <img src={lupe} alt="search" className="w-5 h-5" />
        </button>
      </div>

      {/* Profil Bereich & Mobile Toggle */}
      <div className="relative flex gap-1 md:gap-2 items-center">
        <div className="flex gap-1 md:gap-2 items-center mr-1 md:mr-0">
          {isDarkMode ? (
            <IconMoon size={18} className="md:w-5 md:h-5" />
          ) : (
            <IconSun size={18} className="md:w-5 md:h-5" />
          )}
          <Switch
            onCheckedChange={toggleDarkMode}
            checked={isDarkMode}
            className="scale-75 md:scale-100 origin-right"
          />
        </div>

        {user && (
          <span className="scale-90 md:scale-100">
            <NotificationBell />
          </span>
        )}

        <button
          className="flex items-center justify-center p-1 rounded-full hover:bg-white/5 transition-colors scale-90 md:scale-100"
          onClick={toggleMenu}
        >
          <ProfileIcon />
        </button>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded-md hover:bg-white/5 transition-colors ml-1 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
        </button>

        <UserMenu
          isOpen={isMenuOpen}
          onClose={closeMenu}
          user={user}
          userProfile={userProfile}
          onOpenOnboarding={() => setShowOnboarding(true)}
        />
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b border-border shadow-lg p-4 flex flex-col gap-4 md:hidden z-40">
          <NavLink
            to="/how-it-works"
            className="p-3 bg-muted rounded-lg font-medium"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            So funktioniert's
          </NavLink>
          <NavLink
            to="/overview"
            className="p-3 bg-muted rounded-lg font-medium"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Übersicht
          </NavLink>
          {user ? (
            <NavLink
              to="/my-channel"
              className="p-3 bg-muted rounded-lg font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Meine Videos
            </NavLink>
          ) : (
            <button
              onClick={() => {
                toast.info("Bitte logge dich ein, um deine Videos zu sehen.");
                setIsMobileMenuOpen(false);
              }}
              className="p-3 bg-muted rounded-lg font-medium text-left"
            >
              Meine Videos
            </button>
          )}
          {user && (
            <NavLink
              to="/dashboard"
              className="p-3 bg-muted rounded-lg font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>
          )}
        </div>
      )}

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
