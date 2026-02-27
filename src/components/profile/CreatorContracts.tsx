import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/services/supabaseCollum/client";
import {
  ReactionContract,
  updateReactionContract,
} from "@/services/supabaseCollum/reactionContract";
import {
  Loader2,
  Check,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateLicensePDF } from "@/services/supabaseFunctions";

type FilterStatus = "all" | "pending" | "accepted" | "paid" | "rejected";

interface CreatorContractsProps {
  mode?: "requests" | "active";
}

export const CreatorContracts = ({
  mode = "requests",
}: CreatorContractsProps) => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ReactionContract[]>([]);
  const [licenseeNames, setLicenseeNames] = useState<Record<string, string>>(
    {},
  );
  const [contractRevenues, setContractRevenues] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // In 'active' mode, start on 'paid'; in 'requests' mode start on 'pending'
  const [filter, setFilter] = useState<FilterStatus>(
    mode === "active" ? "paid" : "pending",
  );

  const fetchContracts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("reaction_contracts")
      .select("*")
      .eq("licensor_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setContracts(data);

      // Fetch licensee names
      const ids = [...new Set(data.map((c) => c.licensee_id))];
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ids);
        if (profiles) {
          const nameMap: Record<string, string> = {};
          profiles.forEach((p) => (nameMap[p.id] = p.full_name || "Unbekannt"));
          setLicenseeNames(nameMap);
        }
      }

      // Fetch actual accumulated revenue per contract
      const { data: revenues } = await supabase
        .from("revenue_events")
        .select("contract_id, amount_cents")
        .eq("licensor_id", user.id);

      if (revenues) {
        const revMap: Record<string, number> = {};
        revenues.forEach((r) => {
          if (!revMap[r.contract_id]) revMap[r.contract_id] = 0;
          revMap[r.contract_id] += r.amount_cents / 100;
        });
        setContractRevenues(revMap);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();

    if (!user) return;

    // Realtime updates — optimistically apply event data immediately,
    // then do a full re-fetch to ensure consistency (e.g. for licensee names)
    const channel = supabase
      .channel(`creator-contracts-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reaction_contracts",
          filter: `licensor_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // Immediately add the new contract so it shows without waiting for re-fetch
            setContracts((prev) => [payload.new as ReactionContract, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setContracts((prev) =>
              prev.map((c) =>
                c.id === (payload.new as ReactionContract).id
                  ? (payload.new as ReactionContract)
                  : c,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setContracts((prev) =>
              prev.filter((c) => c.id !== (payload.old as any).id),
            );
          }
          // Background re-fetch to get up-to-date data (e.g. licensee names)
          fetchContracts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAccept = async (contractId: string) => {
    setActionLoading(contractId);
    try {
      await updateReactionContract(contractId, {
        accepted_by_licensor: true,
        licensor_accepted_at: new Date().toISOString(),
      });
      // Trigger PDF generation
      try {
        await generateLicensePDF(contractId);
      } catch (pdfErr) {
        console.warn(
          "PDF generation failed, contract was still accepted:",
          pdfErr,
        );
      }
      await fetchContracts();
    } catch (e) {
      console.error("Accept failed", e);
      alert("Fehler beim Akzeptieren.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (contractId: string) => {
    if (!confirm("Anfrage wirklich ablehnen?")) return;
    setActionLoading(contractId);
    try {
      await updateReactionContract(contractId, {
        status: "REJECTED" as any,
      });
      await fetchContracts();
    } catch (e) {
      console.error("Reject failed", e);
      alert("Fehler beim Ablehnen.");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusInfo = (c: ReactionContract) => {
    const s = c.status || "PENDING";
    if (s === "PAID" || s === "ACTIVE") {
      return {
        badge: (
          <Badge className="bg-green-500 hover:bg-green-600 text-white border-transparent px-2.5 py-1 text-xs flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="h-3 w-3" /> BEZAHLT
          </Badge>
        ),
        filterKey: "paid" as FilterStatus,
      };
    }
    if (s === "PENDING" && c.accepted_by_licensor) {
      return {
        badge: (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-transparent px-2.5 py-1 text-xs flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="h-3 w-3" /> AKZEPTIERT
          </Badge>
        ),
        filterKey: "accepted" as FilterStatus,
      };
    }
    if (s === "PENDING") {
      return {
        badge: (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 text-xs flex items-center gap-1"
          >
            <Clock className="h-3 w-3" /> AUSSTEHEND
          </Badge>
        ),
        filterKey: "pending" as FilterStatus,
      };
    }
    if (s === "REJECTED") {
      return {
        badge: (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/30 px-2.5 py-1 text-xs flex items-center gap-1">
            <XCircle className="h-3 w-3" /> ABGELEHNT
          </Badge>
        ),
        filterKey: "rejected" as FilterStatus,
      };
    }
    return {
      badge: (
        <Badge
          variant="secondary"
          className="px-2.5 py-1 text-xs flex items-center gap-1"
        >
          <AlertCircle className="h-3 w-3" /> {s}
        </Badge>
      ),
      filterKey: "all" as FilterStatus,
    };
  };

  // In 'requests' mode, hide paid/active contracts — those belong to the active licenses tab
  const displayContracts =
    mode === "active"
      ? contracts.filter((c) => c.status === "PAID" || c.status === "ACTIVE")
      : contracts.filter((c) => c.status !== "PAID" && c.status !== "ACTIVE");

  const filteredContracts = displayContracts.filter((c) => {
    if (filter === "all") return true;
    return getStatusInfo(c).filterKey === filter;
  });

  // Count per filter based on displayContracts
  const counts = {
    all: displayContracts.length,
    pending: displayContracts.filter(
      (c) => c.status === "PENDING" && !c.accepted_by_licensor,
    ).length,
    accepted: displayContracts.filter(
      (c) => c.status === "PENDING" && c.accepted_by_licensor,
    ).length,
    paid: displayContracts.filter(
      (c) => c.status === "PAID" || c.status === "ACTIVE",
    ).length,
    rejected: displayContracts.filter((c) => c.status === "REJECTED").length,
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card className="text-center p-12 border-dashed bg-muted/30">
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">
            {mode === "active" ? "Keine aktiven Lizenzen" : "Keine Anfragen"}
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {mode === "active"
              ? "Noch keine bezahlten Lizenzen für deine Videos."
              : "Du hast noch keine Lizenzanfragen erhalten. Sobald jemand eine Lizenz für dein Video beantragt, erscheint sie hier."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar — simplified for active mode */}
      <div className="flex flex-wrap gap-2">
        {(mode === "active"
          ? ([{ key: "all", label: "Alle aktiven Lizenzen" }] as {
              key: FilterStatus;
              label: string;
            }[])
          : ([
              { key: "all", label: "Alle" },
              { key: "pending", label: "Ausstehend" },
              { key: "accepted", label: "Akzeptiert" },
              { key: "rejected", label: "Abgelehnt" },
            ] as { key: FilterStatus; label: string }[])
        ).map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(key)}
            className="text-xs"
          >
            {label}
            {counts[key] > 0 && (
              <span className="ml-1.5 bg-background/20 px-1.5 py-0.5 rounded-full text-[10px]">
                {counts[key]}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Contract List */}
      {filteredContracts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Keine Einträge für diesen Filter.
        </p>
      ) : (
        filteredContracts.map((contract) => {
          const { badge } = getStatusInfo(contract);
          const isPending =
            contract.status === "PENDING" && !contract.accepted_by_licensor;

          return (
            <Card
              key={contract.id}
              className={`overflow-hidden transition-all hover:shadow-md ${
                isPending ? "border-yellow-500/30" : "border-muted"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {badge}
                      <span className="text-xs text-muted-foreground">
                        {new Date(contract.created_at).toLocaleDateString(
                          "de-DE",
                          { day: "2-digit", month: "long", year: "numeric" },
                        )}
                      </span>
                    </div>

                    <h4
                      className="font-semibold text-base truncate"
                      title={contract.original_video_title}
                    >
                      {contract.original_video_title}
                    </h4>

                    <p className="text-sm text-muted-foreground mt-1">
                      {mode === "active" ? "Lizenziert an" : "Anfrage von"}{" "}
                      <span className="font-medium text-foreground">
                        {licenseeNames[contract.licensee_id] ||
                          contract.licensee_name}
                      </span>
                    </p>

                    {contract.original_video_url && (
                      <a
                        href={contract.original_video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        Video ansehen <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {/* Price + Actions */}
                  <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                    <div className="text-right">
                      {contractRevenues[contract.id] !== undefined &&
                      contractRevenues[contract.id] > 0 ? (
                        <>
                          <p className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wider">
                            Bisher verdient:
                          </p>
                          <p className="text-xl font-bold text-emerald-600">
                            {contractRevenues[contract.id].toFixed(2)}{" "}
                            {contract.pricing_currency}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Modell: {contract.pricing_value.toFixed(2)}{" "}
                            {contract.pricing_currency}{" "}
                            {contract.pricing_model_type === 1
                              ? "Festpreis"
                              : "pro 1000 Views"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold">
                            {contract.pricing_value.toFixed(2)}{" "}
                            {contract.pricing_currency}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contract.pricing_model_type === 1
                              ? "Einmalzahlung"
                              : contract.pricing_model_type === 2
                                ? "pro 1000 Views"
                                : "pro 1000 Views (CPM)"}
                          </p>
                        </>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex gap-2">
                        {actionLoading === contract.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleAccept(contract.id)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Annehmen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                              onClick={() => handleReject(contract.id)}
                            >
                              <X className="h-4 w-4 mr-1" /> Ablehnen
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};
