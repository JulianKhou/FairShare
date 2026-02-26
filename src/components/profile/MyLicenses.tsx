import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  getPurchasedContracts,
  ReactionContract,
} from "@/services/supabaseCollum/reactionContract";
import { supabase } from "@/services/supabaseCollum/client";
import {
  Loader2,
  Download,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadLicensePDF } from "@/services/supabaseFunctions";
import { createStripeCheckoutSession } from "@/services/stripeFunctions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MyLicensesProps {
  filter?: "active" | "expired";
}

export const MyLicenses = ({ filter = "active" }: MyLicensesProps) => {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<ReactionContract[]>([]);
  const [reactionTitles, setReactionTitles] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh logic for incoming payments
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setLoading(true);
      let attempts = 0;
      const interval = setInterval(() => {
        if (!user) return;
        attempts++;
        getPurchasedContracts(user.id).then((data) => {
          if (data && data.some((l) => l.status === "PAID")) {
            setLicenses(data || []);
            // Optional: When PAID is found we could clear interval early,
            // but for now let's just update the list.
          } else {
            setLicenses(data || []);
          }
        });

        // 30 attempts * 2s = 60 seconds of polling
        if (attempts >= 30) {
          clearInterval(interval);
          setLoading(false);
          // Clean URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getPurchasedContracts(user.id)
        .then(async (data) => {
          const validLicenses = data || [];
          setLicenses(validLicenses);

          // Fetch titles for reaction videos
          const reactionIds = validLicenses
            .map((l) => l.reaction_video_id)
            .filter((id): id is string => !!id);

          if (reactionIds.length > 0) {
            const { data: videos } = await supabase
              .from("videos")
              .select("id, title")
              .in("id", reactionIds);

            if (videos) {
              const titleMap: Record<string, string> = {};
              videos.forEach((v) => (titleMap[v.id] = v.title));
              setReactionTitles(titleMap);
            }
          }
        })
        .catch((err) => {
          console.error(err);
          setError("Fehler beim Laden der Lizenzen.");
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleDownload = async (license: ReactionContract) => {
    try {
      const fileName = `License-${license.id.slice(0, 8)}.pdf`;
      await downloadLicensePDF(license.id, fileName, license.pdf_storage_path);
    } catch (e: any) {
      alert(`Download fehlgeschlagen: ${e.message}`);
    }
  };

  const getStatusBadge = (license: ReactionContract) => {
    const s = license.status || "ACTIVE";
    if (s === "PAID" || s === "ACTIVE") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white border-transparent px-3 py-1 text-sm flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 className="h-3.5 w-3.5" />
          ACTIVE
        </Badge>
      );
    }
    if (s === "PENDING" && license.accepted_by_licensor) {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-transparent px-3 py-1 text-sm flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 className="h-3.5 w-3.5" />
          AKZEPTIERT
        </Badge>
      );
    }
    if (s === "PENDING") {
      return (
        <Badge
          variant="outline"
          className="text-yellow-600 border-yellow-500 bg-yellow-50 px-3 py-1 text-sm flex items-center gap-1.5"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          PENDING
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="px-3 py-1 flex items-center gap-1.5"
      >
        <AlertCircle className="h-3.5 w-3.5" />
        {s}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4 bg-destructive/10 rounded-lg">
        {error}
      </div>
    );
  }

  const filteredLicenses = licenses.filter((l) => {
    const s = l.status || "ACTIVE";
    if (filter === "active") {
      return ["PAID", "ACTIVE", "PENDING"].includes(s);
    } else {
      return ["CANCELLED", "PAYMENT_FAILED", "REJECTED", "EXPIRED"].includes(s);
    }
  });

  if (filteredLicenses.length === 0) {
    return (
      <Card className="text-center p-12 border-dashed bg-muted/30">
        <CardContent>
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <FileTextIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Keine Lizenzen gefunden
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {filter === "active"
              ? "Du hast noch keine aktiven Lizenzen erworben. Stöbere in den Videos, um Inhalte für deine Reaktionen zu finden."
              : "Du hast keine abgelaufenen oder stornierten Lizenzen."}
          </p>
          {filter === "active" && (
            <Button onClick={() => (window.location.href = "/overview")}>
              Videos entdecken
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {filteredLicenses.map((license) => {
        const reactionTitle = license.reaction_video_id
          ? reactionTitles[license.reaction_video_id] || "Unbekanntes Video"
          : "Noch nicht verknüpft";

        return (
          <Card
            key={license.id}
            className="overflow-hidden border-muted transition-all hover:shadow-md"
          >
            {/* Header with Status Centered */}
            <div className="relative bg-muted/30 p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-mono text-muted-foreground">
                ID: {license.id.slice(0, 8)}
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:block">
                {getStatusBadge(license)}
              </div>
              <div className="sm:hidden w-full flex justify-center">
                {getStatusBadge(license)}
              </div>

              <div className="text-sm font-medium text-muted-foreground">
                {new Date(license.created_at).toLocaleDateString("de-DE")}
              </div>
            </div>

            <CardContent className="p-6">
              {/* Visual Link: Original -> Reaction */}
              <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-card rounded-xl p-2">
                {/* Original Video */}
                <div className="flex-1 w-full p-4 rounded-xl border border-border bg-background/50 flex items-start gap-4">
                  <div className="bg-red-100 dark:bg-red-900/20 p-2.5 rounded-lg shrink-0">
                    <PlayCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Original Video
                    </p>
                    <h4
                      className="font-semibold text-base truncate pr-2"
                      title={license.original_video_title}
                    >
                      {license.original_video_title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      von {license.licensor_name}
                    </p>
                    <a
                      href={license.original_video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline mt-2 inline-flex items-center"
                    >
                      Ansehen <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className="hidden md:flex flex-col items-center justify-center text-muted-foreground shrink-0 px-2">
                  <div className="bg-muted rounded-full p-2">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium mt-1 uppercase text-muted-foreground/70">
                    Lizenziert für
                  </span>
                </div>
                <div className="md:hidden">
                  <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                </div>

                {/* Reaction Video */}
                <div className="flex-1 w-full p-4 rounded-xl border border-border bg-background/50 flex items-start gap-4">
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2.5 rounded-lg shrink-0">
                    <PlayCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Deine Reaktion
                    </p>
                    <h4
                      className="font-semibold text-base truncate pr-2"
                      title={reactionTitle}
                    >
                      {reactionTitle}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {license.reaction_video_id ? (
                        <>
                          Verknüpft ✅
                          <br />
                          <a
                            href={`https://www.youtube.com/watch?v=${license.reaction_video_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline mt-1 inline-flex items-center"
                          >
                            Ansehen <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </>
                      ) : (
                        "Noch ausstehend"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Preis:</span>
                  <span className="font-semibold px-2 py-1 bg-muted rounded-md">
                    {license.pricing_value.toFixed(2)}{" "}
                    {license.pricing_currency}
                    <span className="text-xs ml-1 font-normal opacity-70">
                      (
                      {license.pricing_model_type === 1
                        ? "Fixpreis"
                        : license.pricing_model_type === 2
                          ? "pro 1000 Views"
                          : "pro 1000 Views (CPM)"}
                      )
                    </span>
                  </span>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  {license.status === "PENDING" &&
                    license.accepted_by_licensor && (
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                        disabled={payingId === license.id}
                        onClick={async () => {
                          setPayingId(license.id);
                          try {
                            const { url } = await createStripeCheckoutSession(
                              license.id,
                            );
                            if (url) window.location.href = url;
                          } catch (e) {
                            console.error(e);
                            alert("Fehler beim Starten der Zahlung.");
                          } finally {
                            setPayingId(null);
                          }
                        }}
                      >
                        {payingId === license.id ? "Lade..." : "Jetzt bezahlen"}
                      </Button>
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => handleDownload(license)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Lizenz PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

function FileTextIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
