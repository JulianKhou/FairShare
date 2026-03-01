import { CreatorCard } from "./CreatorCard";
import { useCreators } from "@/hooks/queries/useCreators";
import { IconUsers } from "@tabler/icons-react";

export default function CreatorList() {
  const { data: creators = [], isLoading: loading } = useCreators();

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
        <p className="text-muted-foreground font-medium text-lg">
          Keine Kanäle gefunden.
        </p>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Noch niemand hat ein Video öffentlich auf SimpleShare geteilt.
        </p>
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
