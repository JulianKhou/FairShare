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
import { useEffect, useRef, useState } from "react";
import {
  updateHelpRequestStatus,
  addAdminReply,
  HelpRequest,
} from "@/services/supabaseCollum/helpRequests";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useAllHelpRequests } from "@/hooks/queries/useAllHelpRequests";
import { useHelpThread } from "@/hooks/queries/useHelpThread";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/services/supabaseCollum/client";
import { cn } from "@/lib/utils";

export default function AdminSupport() {
  const queryClient = useQueryClient();
  const { data: requests = [], isLoading: loading } = useAllHelpRequests();

  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Thread state
  const { data: threadMessages = [], isLoading: threadLoading } = useHelpThread(
    selectedRequest?.id,
  );
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel("admin-support-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "help_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["allHelpRequests"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Realtime subscription for thread messages when a ticket is open
  useEffect(() => {
    if (!selectedRequest) return;

    const channel = supabase
      .channel(`admin-thread-${selectedRequest.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "help_request_messages",
          filter: `help_request_id=eq.${selectedRequest.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["helpThread", selectedRequest.id],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRequest, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  const handleRowClick = (req: HelpRequest) => {
    setSelectedRequest(req);
    setReplyText("");
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedRequest(null);
      setReplyText("");
    }
  };

  const handleStatusChange = async (
    newStatus: "OPEN" | "IN_PROGRESS" | "CLOSED",
  ) => {
    if (!selectedRequest) return;
    setIsUpdating(true);
    try {
      await updateHelpRequestStatus(selectedRequest.id, newStatus);
      toast.success("Status aktualisiert!");
      queryClient.invalidateQueries({ queryKey: ["allHelpRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      setSelectedRequest((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    } catch (e: any) {
      toast.error("Fehler beim Update: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedRequest || !replyText.trim()) return;
    setIsSending(true);
    try {
      await addAdminReply(selectedRequest.id, replyText.trim());
      queryClient.invalidateQueries({
        queryKey: ["helpThread", selectedRequest.id],
      });
      setReplyText("");

      // Auto-switch status from OPEN to IN_PROGRESS on first admin reply
      if (selectedRequest.status === "OPEN") {
        try {
          await updateHelpRequestStatus(selectedRequest.id, "IN_PROGRESS");
          queryClient.invalidateQueries({ queryKey: ["allHelpRequests"] });
          queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
          setSelectedRequest((prev) =>
            prev ? { ...prev, status: "IN_PROGRESS" } : null,
          );
        } catch {
          // Non-critical – reply was sent, status update is best-effort
        }
      }

      toast.success("Antwort gesendet!");
    } catch (e: any) {
      toast.error("Fehler beim Senden: " + e.message);
    } finally {
      setIsSending(false);
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-4xl flex flex-col h-[85vh] p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="bg-muted/40 px-6 py-4 border-b flex items-center justify-between shrink-0">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <DialogTitle className="text-xl font-bold">
                  Ticket Details
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm">
                Support-Ticket von{" "}
                <strong className="text-foreground">
                  {selectedRequest?.user_full_name}
                </strong>
                {selectedRequest?.user_email && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {selectedRequest.user_email}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && getStatusBadge(selectedRequest.status)}
          </div>

          {selectedRequest && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Meta row */}
              <div className="px-6 py-3 border-b bg-muted/20 flex flex-wrap items-center gap-6 text-sm shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Betreff:</span>
                  <span className="font-semibold">
                    {selectedRequest.subject}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Erstellt:</span>
                  <span>
                    {new Date(selectedRequest.created_at).toLocaleString(
                      "de-DE",
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-muted-foreground text-xs">Status:</span>
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

              {/* Chat thread */}
              <div className="flex-1 overflow-y-auto space-y-3 px-6 py-4">
                {/* Original message from user */}
                <div className="flex justify-start">
                  <div className="max-w-[75%] space-y-1">
                    <p className="text-xs text-muted-foreground ml-1">
                      {selectedRequest.user_full_name} ·{" "}
                      {new Date(selectedRequest.created_at).toLocaleString(
                        "de-DE",
                      )}
                    </p>
                    <div className="bg-muted/40 border rounded-2xl rounded-tl-sm px-4 py-3 text-sm whitespace-pre-wrap">
                      {selectedRequest.message}
                    </div>
                  </div>
                </div>

                {/* Thread messages */}
                {threadLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  threadMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_role === "admin"
                          ? "justify-end"
                          : "justify-start",
                      )}
                    >
                      <div className="max-w-[75%] space-y-1">
                        <p
                          className={cn(
                            "text-xs text-muted-foreground",
                            msg.sender_role === "admin"
                              ? "text-right mr-1"
                              : "ml-1",
                          )}
                        >
                          {msg.sender_role === "admin"
                            ? "Du (Admin)"
                            : selectedRequest.user_full_name}{" "}
                          · {new Date(msg.created_at).toLocaleString("de-DE")}
                        </p>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                            msg.sender_role === "admin"
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted/40 border rounded-tl-sm",
                          )}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              {selectedRequest.status === "CLOSED" ? (
                <div className="shrink-0 border-t px-6 py-3 text-center bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    Dieses Ticket ist geschlossen. Keine weiteren Antworten
                    möglich.
                  </p>
                </div>
              ) : (
                <div className="shrink-0 border-t px-6 py-3 flex flex-col gap-2 bg-background">
                  <Textarea
                    placeholder="Antwort schreiben..."
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    disabled={isSending}
                    className="resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Strg+Enter zum Senden
                    </p>
                    <Button
                      onClick={handleSendReply}
                      disabled={isSending || !replyText.trim()}
                      size="sm"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Antwort senden
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
