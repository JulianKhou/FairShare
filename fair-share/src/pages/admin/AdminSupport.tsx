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
  getAllHelpRequests,
  updateHelpRequestStatus,
  HelpRequest,
} from "@/services/supabaseCollum/helpRequests";
import { Loader2, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/services/supabaseCollum/client";

export default function AdminSupport() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRequests = async () => {
    try {
      const data = await getAllHelpRequests();
      setRequests(data);
    } catch (error) {
      console.error("Failed to load help requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Re-fetch on realtime changes
    const channel = supabase
      .channel("admin-support-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "help_requests" },
        () => {
          fetchRequests();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRowClick = (req: HelpRequest) => {
    setSelectedRequest(req);
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (
    newStatus: "OPEN" | "IN_PROGRESS" | "CLOSED",
  ) => {
    if (!selectedRequest) return;
    setIsUpdating(true);
    try {
      await updateHelpRequestStatus(selectedRequest.id, newStatus);
      toast.success("Status aktualisiert!");
      setSelectedRequest((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
      // Let realtime subscription handle table update, or do it optimistically:
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id ? { ...r, status: newStatus } : r,
        ),
      );
    } catch (e: any) {
      toast.error("Fehler beim Update: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="destructive">OFFEN</Badge>;
      case "IN_PROGRESS":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            IN BEARBEITUNG
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge
            variant="default"
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            GESCHLOSSEN
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support-Tickets</h1>
          <p className="text-muted-foreground">
            Alle Benutzeranfragen und Hilfe-Gesuche im Überblick.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Historie</CardTitle>
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
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Betreff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow
                    key={req.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(req)}
                  >
                    <TableCell className="text-sm">
                      {new Date(req.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{req.user_full_name}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {req.user_email || "Keine Email"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="truncate max-w-[300px]"
                      title={req.subject}
                    >
                      {req.subject}
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      Keine Support-Tickets gefunden. Super! 🎉
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <DialogTitle>Ticket Details</DialogTitle>
            </div>
            <DialogDescription>
              Support-Ticket von {selectedRequest?.user_full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                <div>
                  <p className="text-muted-foreground font-medium mb-1">
                    Betreff
                  </p>
                  <p className="font-semibold">{selectedRequest.subject}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">
                    Status
                  </p>
                  <select
                    className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedRequest.status}
                    disabled={isUpdating}
                    onChange={(e: any) => handleStatusChange(e.target.value)}
                  >
                    <option value="OPEN">OFFEN</option>
                    <option value="IN_PROGRESS">IN BEARBEITUNG</option>
                    <option value="CLOSED">GESCHLOSSEN</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground font-medium mb-2">
                  Nachricht
                </p>
                <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap text-sm border font-mono">
                  {selectedRequest.message}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                <div>
                  <p>User ID: {selectedRequest.user_id}</p>
                  <p>Ticket ID: {selectedRequest.id}</p>
                  <p>
                    Email: {selectedRequest.user_email || "Nicht hinterlegt"}
                  </p>
                </div>
                {selectedRequest.user_email && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`mailto:${selectedRequest.user_email}?subject=Re: Support Ticket - ${selectedRequest.subject}`}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Antworten
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
