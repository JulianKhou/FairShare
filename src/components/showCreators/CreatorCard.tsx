import { Link } from "react-router-dom";
import { IconUserCircle, IconChevronRight } from "@tabler/icons-react";
import { Profile } from "../../services/supabaseCollum/profiles";

interface CreatorCardProps {
  profile: Profile;
}

export function CreatorCard({ profile }: CreatorCardProps) {
  return (
    <Link
      to={`/creator/${profile.id}`}
      className="group flex flex-col items-center justify-center p-6 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/30 text-center gap-4 relative overflow-hidden"
    >
      <div className="absolute top-4 right-4 text-muted-foreground/30 group-hover:text-primary transition-colors duration-300">
        <IconChevronRight size={24} />
      </div>

      {profile.youtube_channel_avatar ? (
        <img 
          src={profile.youtube_channel_avatar} 
          alt={profile.youtube_channel_title || "Kanal"} 
          className="w-16 h-16 rounded-full object-cover group-hover:ring-4 ring-primary/20 transition-all duration-300"
        />
      ) : (
        <div className="bg-primary/10 p-4 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
          <IconUserCircle className="w-16 h-16 text-primary" />
        </div>
      )}
      
      <div className="flex flex-col items-center gap-1 w-full">
        <h3 className="font-semibold text-lg text-foreground truncate w-full px-2" title={profile.youtube_channel_title || "Unbekannter Kanal"}>
          {profile.youtube_channel_title || "Unbekannter Kanal"}
        </h3>
        {profile.subscriber_count !== undefined && profile.subscriber_count > 0 && (
          <p className="text-sm text-muted-foreground font-medium">
            {profile.subscriber_count.toLocaleString()} Abonnenten
          </p>
        )}
      </div>
    </Link>
  );
}
