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
import { Loader2, Trash2 } from "lucide-react";
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vertragsdetails</DialogTitle>
            <DialogDescription>
              Detailansicht für Vertrag {selectedContract?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="grid gap-6 py-4">
              {/* IDs and Meta */}
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">
                    Erstellt am
                  </p>
                  <p>
                    {new Date(selectedContract.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">
                    Status
                  </p>
                  <Badge
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
                    {selectedContract.status || "UNKNOWN"}
                  </Badge>
                </div>
              </div>

              {/* Beteiligte */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-semibold mb-3">Beteiligte Parteien</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-muted-foreground mb-1">
                      Licensor (Creator)
                    </p>
                    <p>{selectedContract.licensor_name}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      ID: {selectedContract.licensor_id}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground mb-1">
                      Licensee (Reactor)
                    </p>
                    <p>{selectedContract.licensee_name}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      ID: {selectedContract.licensee_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-semibold mb-3">Video Informationen</h3>
                <div className="grid gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-muted-foreground mb-1">
                      Original Video Titel
                    </p>
                    <a
                      href={selectedContract.original_video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedContract.original_video_title}
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-muted-foreground mb-1">
                        Video ID
                      </p>
                      <p className="font-mono text-xs">
                        {selectedContract.original_video_id}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground mb-1">
                        Dauer
                      </p>
                      <p>{selectedContract.original_video_duration} Sek</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vergütung */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-semibold mb-3">Vergütung & Metadaten</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-muted-foreground mb-1">
                      Preismodell
                    </p>
                    <p>Typ {selectedContract.pricing_model_type}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground mb-1">
                      Wert
                    </p>
                    <p>
                      {selectedContract.pricing_currency}{" "}
                      {selectedContract.pricing_value.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground mb-1">
                      FairShare Score
                    </p>
                    <p>{selectedContract.fairshare_score}</p>
                  </div>
                </div>
                {selectedContract.fairshare_metadata && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">
                        Marktmacht Score
                      </p>
                      <p>
                        {selectedContract.fairshare_metadata.marktmacht_score}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">
                        Schöpferische Leistung
                      </p>
                      <p>
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
              <div className="mt-4 flex justify-end pt-4 border-t border-muted/20">
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
