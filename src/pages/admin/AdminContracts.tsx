import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import {
  getAllReactionContracts,
  adminDeleteReactionContract,
  ReactionContract,
} from "@/services/supabaseCollum/reactionContract";
import { supabase } from "@/services/supabaseCollum/client";
import {
  Loader2,
  Trash2,
  RefreshCw,
  FileText,
  Users,
  Activity,
  CreditCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminContracts() {
  const [contracts, setContracts] = useState<ReactionContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] =
    useState<ReactionContract | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const data = await getAllReactionContracts();
        setContracts(data || []);
      } catch (error) {
        console.error("Failed to load contracts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  const handleRowClick = (contract: ReactionContract) => {
    setSelectedContract(contract);
    setIsDialogOpen(true);
  };

  const handleDeleteContract = async () => {
    if (!selectedContract) return;

    if (
      !confirm(
        `Soll der Vertrag ${selectedContract.id} wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await adminDeleteReactionContract(selectedContract.id);

      setContracts((prev) => prev.filter((c) => c.id !== selectedContract.id));
      setIsDialogOpen(false);
      toast.success("Vertrag wurde erfolgreich gelöscht.");
    } catch (err: any) {
      console.error("Fehler beim Löschen:", err);
      toast.error(
        `Fehler beim Löschen: ${err.message || "Unbekannter Fehler"}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "sync-subscription-status",
      );
      if (error) throw error;

      const result = data as any;
      toast.success(
        `Sync abgeschlossen: ${result.updated} aktualisiert, ${result.unchanged} unverändert, ${result.errors} Fehler`,
      );

      // Refresh contracts list if anything changed
      if (result.updated > 0) {
        const freshData = await getAllReactionContracts();
        setContracts(freshData || []);
      }
    } catch (err: any) {
      console.error("Sync failed:", err);
      toast.error("Sync fehlgeschlagen: " + (err.message || "Unbekannt"));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vertragsverwaltung
          </h1>
          <p className="text-muted-foreground">
            Übersicht aller abgeschlossenen, aktiven oder abgelehnten Lizenzen.
          </p>
        </div>
        <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Stripe Sync
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lizenz Verträge</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vertrags-ID</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Licensor</TableHead>
                  <TableHead>Licensee</TableHead>
                  <TableHead>Preis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow
                    key={contract.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(contract)}
                  >
                    <TableCell
                      className="font-mono text-xs text-muted-foreground"
                      title={contract.id}
                    >
                      {contract.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {new Date(contract.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {contract.status === "PAID" ||
                      contract.status === "ACTIVE" ? (
                        <Badge
                          variant="default"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          {contract.status}
                        </Badge>
                      ) : contract.status === "PENDING" ? (
                        <Badge
                          variant="outline"
                          className="text-yellow-600 border-yellow-600"
                        >
                          PENDING
                        </Badge>
                      ) : contract.status === "REJECTED" ? (
                        <Badge variant="destructive">REJECTED</Badge>
                      ) : (
                        <Badge variant="secondary">
                          {contract.status || "UNKNOWN"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell title={contract.licensor_id}>
                      {contract.licensor_name}
                    </TableCell>
                    <TableCell title={contract.licensee_id}>
                      {contract.licensee_name}
                    </TableCell>
                    <TableCell>
                      {contract.pricing_currency}{" "}
                      {contract.pricing_value.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {contracts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      Keine Verträge gefunden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden bg-background">
          <div className="bg-muted/40 p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
            <DialogHeader className="text-left">
              <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                Vertragsdetails
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Detailansicht für Vertrag{" "}
                <span className="font-mono text-sm bg-muted/60 px-2 py-1 rounded-md text-foreground">
                  {selectedContract?.id}
                </span>
              </DialogDescription>
            </DialogHeader>
            {selectedContract && (
              <Badge
                className="px-4 py-1.5 text-sm shadow-sm w-fit"
                variant={
                  selectedContract.status === "PAID" ||
                  selectedContract.status === "ACTIVE"
                    ? "default"
                    : selectedContract.status === "PENDING"
                      ? "outline"
                      : selectedContract.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                }
              >
                {selectedContract.status === "PAID" ||
                selectedContract.status === "ACTIVE"
                  ? "Aktiv / Bezahlt"
                  : selectedContract.status}
              </Badge>
            )}
          </div>

          {selectedContract && (
            <div className="p-8 grid gap-8 bg-zinc-50/30 dark:bg-zinc-950/30">
              {/* Timeline Info (Header Replacement) */}
              <div className="flex flex-wrap items-center gap-8 text-sm text-muted-foreground w-full bg-card border rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    Erstellt:
                  </span>
                  <span>
                    {new Date(selectedContract.created_at).toLocaleString()}
                  </span>
                </div>
                {selectedContract.licensor_accepted_at && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      Akzeptiert:
                    </span>
                    <span>
                      {new Date(
                        selectedContract.licensor_accepted_at,
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <span className="font-semibold text-foreground">
                    Vertrags-Version:
                  </span>
                  <span className="font-mono bg-muted/50 px-2 py-0.5 rounded text-xs">
                    {selectedContract.contract_version}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Beteiligte Parteien */}
                <div className="border rounded-xl bg-card shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-muted/30 px-6 py-4 border-b flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">
                      Beteiligte Parteien
                    </h3>
                  </div>
                  <div className="p-6 grid gap-6 flex-1">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Original-Urheber (Licensor)
                      </p>
                      <div className="bg-muted/20 p-4 rounded-lg border border-border/50">
                        <p className="text-xl font-bold">
                          {selectedContract.licensor_name}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-2 break-all">
                          {selectedContract.licensor_id}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Nutzer (Licensee)
                      </p>
                      <div className="bg-muted/20 p-4 rounded-lg border border-border/50">
                        <p className="text-xl font-bold">
                          {selectedContract.licensee_name}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-2 break-all">
                          {selectedContract.licensee_id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="border rounded-xl bg-card shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-muted/30 px-6 py-4 border-b flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">
                      Lizenziertes Video
                    </h3>
                  </div>
                  <div className="p-6 space-y-6 flex-1">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Original Video
                      </p>
                      <a
                        href={selectedContract.original_video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-lg font-medium text-primary hover:underline line-clamp-2"
                      >
                        {selectedContract.original_video_title}
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/50">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          YouTube ID
                        </p>
                        <p className="font-mono text-sm bg-muted/50 w-fit px-2 py-1 rounded border">
                          {selectedContract.original_video_id}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Dauer
                        </p>
                        <p className="text-lg">
                          {selectedContract.original_video_duration}
                        </p>
                      </div>
                    </div>

                    {selectedContract.reaction_video_id && (
                      <div className="space-y-2 pt-4 border-t border-border/50">
                        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Verknüpftes Video (Licensee)
                        </p>
                        <p className="font-mono text-sm bg-muted/50 w-fit px-2 py-1 rounded border">
                          {selectedContract.reaction_video_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vergütung & Metadaten (Wide Format) */}
              <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                <div className="bg-muted/30 px-6 py-4 border-b flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">
                    Vergütung & FairShare Daten
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Preismodell
                      </p>
                      <p className="text-xl font-medium">
                        Typ {selectedContract.pricing_model_type}
                        <span className="block text-sm text-primary/80 mt-1 font-normal">
                          {selectedContract.pricing_model_type === 1
                            ? "Einmalzahlung (Fixpreis)"
                            : selectedContract.pricing_model_type === 2
                              ? "Abo: Pay per View"
                              : "Abo: CPM Modell"}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Vertragswert
                      </p>
                      <p className="text-3xl font-bold font-mono">
                        {selectedContract.pricing_currency}{" "}
                        {selectedContract.pricing_value.toFixed(2)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Gesamt FairShare
                      </p>
                      <div className="flex flex-col gap-2">
                        <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {selectedContract.fairshare_score}
                          <span className="text-lg text-emerald-600/60">
                            /100
                          </span>
                        </span>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            style={{
                              width: `${Math.min(100, (selectedContract.fairshare_score / 100) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedContract.fairshare_metadata && (
                    <div className="pt-6 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Marktmacht
                        </p>
                        <p className="text-lg font-medium">
                          {selectedContract.fairshare_metadata.marktmacht_score}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Schöpfung
                        </p>
                        <p className="text-lg font-medium">
                          {
                            selectedContract.fairshare_metadata
                              .schoepferische_leistung
                          }
                        </p>
                      </div>
                      {(selectedContract.stripe_subscription_id ||
                        selectedContract.stripe_session_id) && (
                        <div className="space-y-1 col-span-2">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Stripe Info
                          </p>
                          <p
                            className="text-sm font-mono text-muted-foreground truncate"
                            title={
                              selectedContract.stripe_subscription_id ||
                              selectedContract.stripe_session_id
                            }
                          >
                            {selectedContract.stripe_subscription_id
                              ? `Sub: ${selectedContract.stripe_subscription_id}`
                              : `Session: ${selectedContract.stripe_session_id}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              <div className="mt-2 flex items-center justify-between pt-4 border-t border-muted/20">
                <div className="text-xs text-muted-foreground">
                  Aktion kann nicht rückgängig gemacht werden
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedContract.status === "ACTIVE" &&
                    selectedContract.pricing_model_type === 2 && (
                      <Button
                        variant="outline"
                        className="border-yellow-500 text-yellow-600 hover:bg-yellow-500/10"
                        onClick={async () => {
                          const mockViews =
                            (selectedContract.last_reported_view_count || 0) +
                            5000;
                          toast.promise(
                            import("@/services/supabaseCollum/reactionContract").then(
                              (m) =>
                                m.adminReportUsage(
                                  selectedContract.id,
                                  mockViews,
                                ),
                            ),
                            {
                              loading: "Sende Test-Views...",
                              success: (res: any) =>
                                `Erfolgreich gemeldet! (Delta: ${res.processed[0]?.viewsDelta || "Unbekannt"})`,
                              error: "Fehler beim Melden der Test-Views",
                            },
                          );
                        }}
                      >
                        Test: +5000 Views melden
                      </Button>
                    )}
                  <Button
                    variant="destructive"
                    onClick={handleDeleteContract}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Vertrag Löschen
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
