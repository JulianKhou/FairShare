import { FairShareLogo } from "../fairShareLogo.tsx";
import lupe from "../../assets/lupeIcon.svg";
import ProfileIcon from "./profileIcon";
import { UserMenu } from "./profileMenu";
import { useToggle } from "../../hooks/useToggle.ts";
import { useAuth } from "../../hooks/auth/useAuth";
function Header() {
    const { user } = useAuth();
    const { value: isMenuOpen, toggle: toggleMenu, close: closeMenu } = useToggle();
    return (
        <header className="flex justify-between bg-fair-surface pt-2 pl-2 pr-2 h-20 items-center absolute top-0 left-0 right-0">
            <div className="flex gap-4 items-center">
                <FairShareLogo size={40} />
                <h1 className="text-2xl font-bold">FairShare</h1>
            </div>
            <div className="flex gap-4 items-center h-20">
                <div className="flex gap-4 items-center h-20   hover:border-fair-teal hover:border-b-2 hover:pb-2 hover:text-fair-teal" ><a href="" className="hover:text-fair-teal">Explore</a></div>
                <div className="flex gap-4 items-center h-20 border-0 hover:border-fair-teal hover:border-b-2 hover:pb-2 hover:text-fair-teal"><a href="" className="hover:text-fair-teal">Upload</a></div>
                <div className="flex gap-4 items-center h-20 border-0 hover:border-fair-teal hover:border-b-2 hover:pb-2 hover:text-fair-teal"><a href="" className="hover:text-fair-teal">My Videos</a></div>
            </div>
            <div className="flex gap-4 items-center">
                <input type="text" placeholder="Search" className="w-64 h-10 border-1 border-gray-500 rounded-full p-2"/>
                <button className="h-10">
                    <img src={lupe} alt="search" className="w-8 h-8 rounded-full hover:shadow-lg shadow-gray-500"/>
                </button>
            </div>
            <div className="flex gap-4 h-20 right-4">
                <button className=" hover:border-fair-teal hover:border-b-2 hover:pb-2 hover:text-fair-teal" onClick={toggleMenu} aria-label="Profile" >
                <ProfileIcon />
                </button>
            </div>
            <UserMenu isOpen={isMenuOpen} onClose={closeMenu} user={user} />
           
        </header>
    );
}
export default Header;