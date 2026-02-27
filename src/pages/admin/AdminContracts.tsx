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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden">
          <div className="bg-muted/30 p-6 border-b">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Vertragsdetails
              </DialogTitle>
              <DialogDescription>
                Detailansicht für Vertrag{" "}
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                  {selectedContract?.id}
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedContract && (
            <div className="p-6 grid gap-6">
              {/* Header Meta Status */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-card border rounded-xl p-4 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Erstellt am
                  </p>
                  <p className="font-semibold">
                    {new Date(selectedContract.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 text-right">
                    Status
                  </p>
                  <Badge
                    className="px-3 py-1 shadow-sm"
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
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Beteiligte */}
                <div className="border rounded-xl p-5 bg-card shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold tracking-tight">
                      Beteiligte Parteien
                    </h3>
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Licensor (Creator)
                      </p>
                      <p className="font-medium">
                        {selectedContract.licensor_name}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground break-all">
                        {selectedContract.licensor_id}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Licensee (Reactor)
                      </p>
                      <p className="font-medium">
                        {selectedContract.licensee_name}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground break-all">
                        {selectedContract.licensee_id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="border rounded-xl p-5 bg-card shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold tracking-tight">
                      Video Optionen
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Original Video
                      </p>
                      <a
                        href={selectedContract.original_video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-medium line-clamp-2"
                      >
                        {selectedContract.original_video_title}
                      </a>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Video ID
                        </p>
                        <p className="font-mono text-xs bg-muted w-fit px-1.5 py-0.5 rounded">
                          {selectedContract.original_video_id}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Dauer
                        </p>
                        <p className="font-medium">
                          {selectedContract.original_video_duration} Sek
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vergütung */}
              <div className="border rounded-xl p-5 bg-card shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold tracking-tight">
                    Vergütung & Metadaten
                  </h3>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Preismodell
                    </p>
                    <p className="font-medium">
                      Typ {selectedContract.pricing_model_type}
                      {selectedContract.pricing_model_type === 1
                        ? " (Einmalzahlung)"
                        : selectedContract.pricing_model_type === 2
                          ? " (Pay per View)"
                          : ""}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Wert
                    </p>
                    <p className="font-medium text-lg">
                      {selectedContract.pricing_currency}{" "}
                      {selectedContract.pricing_value.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      FairShare Score
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">
                        {selectedContract.fairshare_score}
                      </span>
                      <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min(100, (selectedContract.fairshare_score / 100) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedContract.fairshare_metadata && (
                  <div className="mt-2 pt-4 border-t grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Marktmacht Score
                      </p>
                      <p className="font-medium">
                        {selectedContract.fairshare_metadata.marktmacht_score}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Schöpferische Leistung
                      </p>
                      <p className="font-medium">
                        {
                          selectedContract.fairshare_metadata
                            .schoepferische_leistung
                        }
                      </p>
                    </div>
                  </div>
                )}
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
