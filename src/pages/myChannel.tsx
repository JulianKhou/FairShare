import { useEffect, useState } from "react";
import { IconUserCircle } from "@tabler/icons-react";
import ShowVideoList from "../components/showVideos/showVideoList";
import LoadVideosButton from "../components/showVideos/loadVideosButton";
import { useAuth } from "../hooks/auth/useAuth";
import { getProfile, Profile } from "../services/supabaseCollum/profiles";

type VideoFilter = "public" | "all";

export default function MyChannel() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<VideoFilter>("public");

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getProfile(user.id);
        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h2 className="text-xl font-semibold">Nicht angemeldet</h2>
        <p className="text-muted-foreground">Bitte melde dich an, um deinen Kanal zu sehen.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-10 pb-20 gap-8 w-full">
      <div className="w-full max-w-7xl px-4 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <IconUserCircle className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {profile?.full_name || "Mein Kanal"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Dein öffentliches Creator-Profil
              </p>
            </div>
          </div>
          
          <LoadVideosButton />
        </div>

        {/* Toolbar: Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center bg-muted/40 rounded-full p-1 border border-border/30">
            <button
              onClick={() => setFilter("public")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                filter === "public"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Öffentliche Ansicht
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                filter === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Alle meine Videos
            </button>
          </div>
        </div>

        {/* Video List */}
        <div className="mt-4">
          <ShowVideoList 
            videoType={filter === "public" ? "myVideosLicensed" : "myVideos"} 
            userId={user.id} 
          />
        </div>
        
      </div>
    </div>
  );
}
