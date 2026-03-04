import { Link } from "react-router-dom";
import { IconUserCircle, IconArrowRight } from "@tabler/icons-react";
import { Profile } from "../../services/supabaseCollum/profiles";

interface CreatorCardProps {
  profile: Profile;
}

export function CreatorCard({ profile }: CreatorCardProps) {
  return (
    <Link
      to={`/creator/${profile.id}`}
      className="group flex flex-col items-center justify-center p-6 bg-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-simple-purple/40 text-center gap-4 relative overflow-hidden"
    >
      {/* Background hover gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-simple-purple/0 to-simple-teal/0 group-hover:from-simple-purple/5 group-hover:to-simple-teal/5 transition-all duration-500 rounded-2xl" />

      <div className="relative z-10 flex flex-col items-center gap-4 w-full">
        {/* Avatar */}
        {profile.youtube_channel_avatar ? (
          <img
            src={profile.youtube_channel_avatar}
            alt={profile.youtube_channel_title || "Kanal"}
            className="w-20 h-20 rounded-full object-cover ring-2 ring-border group-hover:ring-simple-purple/40 transition-all duration-300"
          />
        ) : (
          <div className="bg-simple-purple/10 p-4 rounded-full group-hover:bg-simple-purple/20 transition-colors duration-300">
            <IconUserCircle className="w-16 h-16 text-simple-purple" />
          </div>
        )}

        {/* Name & Stats */}
        <div className="flex flex-col items-center gap-1 w-full">
          <h3
            className="font-bold text-base text-foreground truncate w-full px-2 group-hover:text-simple-purple transition-colors"
            title={profile.youtube_channel_title || "Unbekannter Kanal"}
          >
            {profile.youtube_channel_title || "Unbekannter Kanal"}
          </h3>
          {profile.subscriber_count !== undefined &&
            profile.subscriber_count > 0 && (
              <p className="text-sm text-muted-foreground font-medium">
                {profile.subscriber_count.toLocaleString()} Abonnenten
              </p>
            )}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground group-hover:text-simple-purple transition-colors duration-300">
          Kanal ansehen
          <IconArrowRight
            size={14}
            className="group-hover:translate-x-0.5 transition-transform duration-300"
          />
        </div>
      </div>
    </Link>
  );
}
