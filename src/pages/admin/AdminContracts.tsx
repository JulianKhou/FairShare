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
            <div className="p-5 space-y-4">
              {/* Timeline row */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2.5 border">
                <span>
                  <strong className="text-foreground">Erstellt:</strong>{" "}
                  {new Date(selectedContract.created_at).toLocaleString(
                    "de-DE",
                  )}
                </span>
                {selectedContract.licensor_accepted_at && (
                  <span>
                    <strong className="text-foreground">Akzeptiert:</strong>{" "}
                    {new Date(
                      selectedContract.licensor_accepted_at,
                    ).toLocaleString("de-DE")}
                  </span>
                )}
                <span className="ml-auto">
                  <strong className="text-foreground">Version:</strong>{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded">
                    {selectedContract.contract_version}
                  </code>
                </span>
              </div>

              {/* Two columns: Parteien + Video */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Beteiligte */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" /> Beteiligte Parteien
                  </h3>
                  <div className="grid gap-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">
                        Licensor:
                      </span>
                      <span className="font-medium text-sm text-right truncate">
                        {selectedContract.licensor_name}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground/60 break-all -mt-1">
                      {selectedContract.licensor_id}
                    </p>
                    <div className="flex items-baseline justify-between gap-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground shrink-0">
                        Licensee:
                      </span>
                      <span className="font-medium text-sm text-right truncate">
                        {selectedContract.licensee_name}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground/60 break-all -mt-1">
                      {selectedContract.licensee_id}
                    </p>
                  </div>
                </div>

                {/* Video */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <Activity className="w-4 h-4" /> Lizenziertes Video
                  </h3>
                  <a
                    href={selectedContract.original_video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary hover:underline line-clamp-2 block"
                  >
                    {selectedContract.original_video_title}
                  </a>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">
                        YouTube ID
                      </span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {selectedContract.original_video_id}
                      </code>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">
                        Dauer
                      </span>
                      <span className="font-medium">
                        {selectedContract.original_video_duration}
                      </span>
                    </div>
                  </div>
                  {selectedContract.reaction_video_id && (
                    <div className="pt-2 border-t">
                      <span className="text-xs text-muted-foreground block mb-0.5">
                        Verknüpftes Video
                      </span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {selectedContract.reaction_video_id}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              {/* Vergütung — compact 3-col row */}
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-4 h-4" /> Vergütung & FairShare
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">
                      Preismodell
                    </span>
                    <p className="font-semibold text-sm">
                      {selectedContract.pricing_model_type === 1
                        ? "Einmalzahlung"
                        : selectedContract.pricing_model_type === 2
                          ? "Abo (Views)"
                          : "Abo (CPM)"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">
                      Vertragswert
                    </span>
                    <p className="text-xl font-bold font-mono">
                      {selectedContract.pricing_value.toFixed(2)}{" "}
                      {selectedContract.pricing_currency}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">
                      FairShare Score
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {selectedContract.fairshare_score}
                        <span className="text-sm text-emerald-600/50">
                          /100
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${Math.min(100, selectedContract.fairshare_score)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                {selectedContract.fairshare_metadata && (
                  <div className="pt-3 border-t flex flex-wrap gap-6 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Marktmacht:
                      </span>{" "}
                      <span className="font-medium">
                        {selectedContract.fairshare_metadata.marktmacht_score}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Schöpfung:
                      </span>{" "}
                      <span className="font-medium">
                        {
                          selectedContract.fairshare_metadata
                            .schoepferische_leistung
                        }
                      </span>
                    </div>
                    {(selectedContract.stripe_subscription_id ||
                      selectedContract.stripe_session_id) && (
                      <div className="ml-auto">
                        <span className="text-xs text-muted-foreground">
                          Stripe:
                        </span>{" "}
                        <code
                          className="text-xs text-muted-foreground"
                          title={
                            selectedContract.stripe_subscription_id ||
                            selectedContract.stripe_session_id
                          }
                        >
                          {selectedContract.stripe_subscription_id
                            ? `Sub: ${selectedContract.stripe_subscription_id.slice(0, 20)}…`
                            : `Ses: ${selectedContract.stripe_session_id?.slice(0, 20)}…`}
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Abo-Laufzeit — only for active subscriptions */}
              {(selectedContract.status === "ACTIVE" ||
                selectedContract.status === "PAID") &&
                selectedContract.pricing_model_type !== 1 &&
                (() => {
                  const startDate =
                    selectedContract.licensor_accepted_at ||
                    selectedContract.created_at;
                  const endDate = new Date(startDate);
                  endDate.setFullYear(endDate.getFullYear() + 1);
                  const daysLeft = Math.max(
                    0,
                    Math.ceil(
                      (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                    ),
                  );
                  const pct = Math.min(
                    100,
                    Math.round(((365 - daysLeft) / 365) * 100),
                  );
                  const warn = daysLeft <= 30;
                  return (
                    <div
                      className={`rounded-lg border p-3 ${warn ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300/50" : "bg-blue-50 dark:bg-blue-900/10 border-blue-300/30"}`}
                    >
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span
                          className={
                            warn
                              ? "text-orange-700 dark:text-orange-400"
                              : "text-blue-700 dark:text-blue-400"
                          }
                        >
                          {warn ? "⚠️" : "📅"} Abo-Laufzeit
                        </span>
                        <span
                          className={
                            warn
                              ? "text-orange-700 dark:text-orange-400"
                              : "text-blue-700 dark:text-blue-400"
                          }
                        >
                          {daysLeft} Tage verbleibend
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/50 dark:bg-white/10 rounded-full overflow-hidden mb-1.5">
                        <div
                          className={`h-full rounded-full ${warn ? "bg-orange-500" : "bg-blue-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>
                          Start:{" "}
                          {new Date(startDate).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>
                          Ende:{" "}
                          {endDate.toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })()}

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
