import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IconArrowLeft, IconUserCircle } from "@tabler/icons-react";
import ShowVideoList from "../components/showVideos/showVideoList";
import { getProfile, Profile } from "../services/supabaseCollum/profiles";

export default function CreatorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getProfile(id);
        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <IconUserCircle className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Creator nicht gefunden</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-primary hover:underline"
        >
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-10 pb-20 gap-8 w-full">
      <div className="w-full max-w-7xl px-4 lg:px-8">
        {/* Header & Back Button */}
        <div className="flex items-center gap-4 mb-8 border-b border-border/50 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title="Zurück"
          >
            <IconArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <IconUserCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {profile?.full_name || "Unbekannter Creator"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Öffentliche Videos
              </p>
            </div>
          </div>
        </div>

        {/* Video List */}
        <div className="mt-8">
          {id && <ShowVideoList videoType="myVideosLicensed" userId={id} />}
        </div>
      </div>
    </div>
  );
}
