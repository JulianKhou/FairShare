import { CreatorCard } from "./CreatorCard";
import { useCreators } from "@/hooks/queries/useCreators";
import { IconUsers } from "@tabler/icons-react";

interface CreatorListProps {
  searchQuery?: string;
}

export default function CreatorList({ searchQuery = "" }: CreatorListProps) {
  const { data: creators = [], isLoading: loading } = useCreators();

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  const filtered = searchQuery.trim()
    ? creators.filter((c) =>
        c.youtube_channel_title
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : creators;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <IconUsers className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium text-lg">
          {searchQuery
            ? `Kein Kanal für "${searchQuery}" gefunden.`
            : "Keine Kanäle gefunden."}
        </p>
        {!searchQuery && (
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Noch niemand hat ein Video öffentlich auf SimpleShare geteilt.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
        Kanäle gefunden
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
        {filtered.map((profile) => (
          <CreatorCard key={profile.id} profile={profile} />
        ))}
      </div>
    </>
  );
}
