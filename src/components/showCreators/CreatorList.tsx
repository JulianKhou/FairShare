import { useEffect, useState } from "react";
import { CreatorCard } from "./CreatorCard";
import { getLicensedVideosFromSupabase } from "../../services/supabaseCollum/database";
import { getProfilesByIds, Profile } from "../../services/supabaseCollum/profiles";
import { IconUsers } from "@tabler/icons-react";

export default function CreatorList() {
  const [creators, setCreators] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCreators() {
      try {
        setLoading(true);
        // 1. Fetch all licensed videos to find active creators
        const licensedVideos = await getLicensedVideosFromSupabase();
        
        if (!licensedVideos || licensedVideos.length === 0) {
          setCreators([]);
          setLoading(false);
          return;
        }

        // 2. Extract unique creator IDs
        const uniqueCreatorIds = Array.from(
          new Set(
            licensedVideos
              .map((video) => video.creator_id)
              .filter(Boolean) as string[]
          )
        );

        if (uniqueCreatorIds.length === 0) {
          setCreators([]);
          setLoading(false);
          return;
        }

        // 3. Fetch full profiles for these creators
        const profiles = await getProfilesByIds(uniqueCreatorIds);
        
        // Let's sort them alphabetically by name
        profiles.sort((a, b) => 
          (a.full_name || "").localeCompare(b.full_name || "")
        );

        setCreators(profiles);
      } catch (error) {
        console.error("Failed to load creators:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCreators();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <IconUsers className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium text-lg">Keine Kanäle gefunden.</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">Noch niemand hat ein Video öffentlich auf SimpleShare geteilt.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
      {creators.map((profile) => (
        <CreatorCard key={profile.id} profile={profile} />
      ))}
    </div>
  );
}
