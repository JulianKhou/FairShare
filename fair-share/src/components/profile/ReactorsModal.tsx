import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseCollum/client";
import { ReactionContract } from "@/services/supabaseCollum/reactionContract";
import { Loader2, ExternalLink, Youtube, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ReactorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: ReactionContract[];
}

interface ReactorDisplay {
  id: string; // licensee_id
  name: string;
  avatarUrl?: string;
  channelId?: string;
  contracts: ReactionContract[];
}

export const ReactorsModal = ({
  isOpen,
  onClose,
  contracts,
}: ReactorsModalProps) => {
  const [reactors, setReactors] = useState<ReactorDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && contracts.length > 0) {
      const fetchReactorDetails = async () => {
        setLoading(true);
        try {
          // 1. Group contracts by licensee_id
          const grouped = new Map<string, ReactionContract[]>();
          contracts.forEach((c) => {
            const list = grouped.get(c.licensee_id) || [];
            list.push(c);
            grouped.set(c.licensee_id, list);
          });

          // 2. Fetch profiles for all licensees
          const licenseeIds = Array.from(grouped.keys());
          const { data: profiles, error } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, youtube_channel_id")
            .in("id", licenseeIds);

          if (error) throw error;

          // 3. Merge data
          const displayList: ReactorDisplay[] = licenseeIds.map((id) => {
            const profile = profiles?.find((p) => p.id === id);
            return {
              id,
              name: profile?.full_name || "Unknown User",
              avatarUrl: profile?.avatar_url,
              channelId: profile?.youtube_channel_id,
              contracts: grouped.get(id) || [],
            };
          });

          setReactors(displayList);
        } catch (err) {
          console.error("Failed to fetch reactor details", err);
        } finally {
          setLoading(false);
        }
      };

      fetchReactorDetails();
    }
  }, [isOpen, contracts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Unique Reactors</h2>
            <p className="text-sm text-muted-foreground">
              Liste aller Kanäle, die Lizenzen erworben haben.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : reactors.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              Keine Daten verfügbar.
            </div>
          ) : (
            reactors.map((reactor) => (
              <Card
                key={reactor.id}
                className="overflow-hidden bg-muted/20 border-muted"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-border">
                        {reactor.avatarUrl ? (
                          <img
                            src={reactor.avatarUrl}
                            alt={reactor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          reactor.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-base">
                          {reactor.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {reactor.contracts.length} Lizenzen
                        </p>
                      </div>
                    </div>
                    {reactor.channelId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 shrink-0"
                        onClick={() =>
                          window.open(
                            `https://youtube.com/channel/${reactor.channelId}`,
                            "_blank",
                          )
                        }
                      >
                        <Youtube className="h-4 w-4 text-red-600" />
                        Reactor Kanal
                      </Button>
                    )}
                  </div>

                  {/* List of Licensed Videos */}
                  <div className="space-y-2 mt-2 bg-background/50 rounded-lg p-3 border border-border/50">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">
                      Lizenzen & Reaktionen
                    </p>
                    {reactor.contracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="flex items-center justify-between text-sm py-2 px-2 hover:bg-muted/50 rounded-md transition-colors border-b border-border/40 last:border-0 last:pb-0"
                      >
                        <span
                          className="truncate flex-1 font-medium pr-2 text-foreground/90"
                          title={contract.original_video_title}
                        >
                          {contract.original_video_title}
                        </span>

                        {contract.reaction_video_id ? (
                          <a
                            href={`https://www.youtube.com/watch?v=${contract.reaction_video_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline hover:bg-primary/5 px-2 py-1 rounded inline-flex items-center shrink-0 border border-primary/20"
                          >
                            Zum Reactions Video{" "}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground italic px-2 py-1">
                            Reaktion ausstehend
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
