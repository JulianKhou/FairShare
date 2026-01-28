import { FairShareLogo } from "../fairShareLogo.tsx";
import lupe from "../../assets/lupeIcon.svg";
import ProfileIcon from "./profileIcon";
import { UserMenu } from "./profileMenu";
import { useToggle } from "../../hooks/useToggle.ts";
import { useAuth } from "../../hooks/auth/useAuth";
import { NavLink } from "react-router-dom";

function Header() {
  const { user } = useAuth();
  const {
    value: isMenuOpen,
    toggle: toggleMenu,
    close: closeMenu,
  } = useToggle();

  // Gemeinsame Styles für alle Nav-Links
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center h-full px-2 border-b-2 transition-all ${
      isActive
        ? "border-fair-teal text-fair-teal"
        : "border-transparent text-fair-text hover:text-fair-teal hover:border-fair-teal"
    }`;

  return (
    <header className="flex justify-between bg-fair-surface px-4 h-20 items-center fixed top-0 left-0 right-0 z-50 shadow-md">
      {/* Logo Sektion */}
      <div className="flex gap-4 items-center">
        <FairShareLogo size={40} />
        <h1 className="text-2xl font-bold tracking-tight">
          Fair<span className="text-fair-teal">Share</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex gap-8 h-full">
        <NavLink to="/explore" className={navLinkClasses}>
          Explore
        </NavLink>
        <NavLink to="/upload" className={navLinkClasses}>
          Upload
        </NavLink>
        <NavLink to="/my-videos" className={navLinkClasses}>
          My Videos
        </NavLink>
      </nav>

      {/* Suche */}
      <div className="flex gap-2 items-center bg-white/5 rounded-full px-4 py-1 border border-white/10 focus-within:border-fair-teal/50 transition-all">
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
      <div className="relative">
        <button
          className="flex items-center justify-center p-1 rounded-full hover:bg-white/5 transition-colors"
          onClick={toggleMenu}
        >
          <ProfileIcon />
        </button>
        {/* Das Menü sollte absolut zum Button positioniert sein */}
        <UserMenu isOpen={isMenuOpen} onClose={closeMenu} user={user} />
      </div>
    </header>
  );
}

export default Header;
