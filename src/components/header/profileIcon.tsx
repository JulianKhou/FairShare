
import { useAuth } from "../../hooks/auth/useAuth";
function ProfileIcon() {
    const { user,loading } = useAuth();
    const userIcon = user?.user_metadata.avatar_url || "../src/assets/profile-circle-svgrepo-com.svg";
    
    return (
        <div className="flex items-center gap-2 border-2 border-gray-500 rounded-full ">
            <img src={userIcon} alt="" className="w-10 h-10 rounded-full " referrerPolicy="no-referrer" />
        </div>
    );
}
export default ProfileIcon;