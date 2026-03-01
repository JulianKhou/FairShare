import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Send,
  HelpCircle,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  createHelpRequest,
  addUserReply,
  HelpRequest,
} from "@/services/supabaseCollum/helpRequests";
import { supabase } from "@/services/supabaseCollum/client";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useUserHelpRequests } from "@/hooks/queries/useUserHelpRequests";
import { useHelpThread } from "@/hooks/queries/useHelpThread";
import { useAuth } from "@/hooks/auth/useAuth";

interface HelpRequestModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpRequestModal({
  isOpen,
  onOpenChange,
}: HelpRequestModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: requests = [], isLoading: loading } = useUserHelpRequests(
    user?.id,
  );

  const [activeTab, setActiveTab] = useState<string>("new");
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(
    null,
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thread state
  const { data: threadMessages = [], isLoading: threadLoading } = useHelpThread(
    selectedRequest?.id,
  );
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Realtime: listen for new thread messages in the selected ticket
  useEffect(() => {
    if (!selectedRequest) return;

    const channel = supabase
      .channel(`help-thread-${selectedRequest.id}`)
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

  // Realtime: refresh request list
  useEffect(() => {
    if (!isOpen || !user) return;

    const channel = supabase
      .channel(`user-help-requests-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "help_requests",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["userHelpRequests", user.id],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user, queryClient]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  const handleTicketClick = (req: HelpRequest) => {
    setSelectedRequest(req);
    setReplyText("");
    // We don't change activeTab here, we just show details within the "mine" tab
  };

  const handleBackToList = () => {
    setSelectedRequest(null);
    setReplyText("");
  };

  const handleUserReply = async () => {
    if (!selectedRequest || !replyText.trim()) return;
    setIsReplying(true);
    try {
      await addUserReply(selectedRequest.id, replyText.trim());
      queryClient.invalidateQueries({
        queryKey: ["helpThread", selectedRequest.id],
      });
      setReplyText("");
      toast.success("Antwort gesendet!");
    } catch (e: any) {
      toast.error("Fehler: " + e.message);
    } finally {
      setIsReplying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await createHelpRequest(subject, message);
      toast.success("Support-Anfrage wurde gesendet!");
      queryClient.invalidateQueries({
        queryKey: ["userHelpRequests", user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      setSubject("");
      setMessage("");
      setActiveTab("mine");
    } catch (e: any) {
      console.error("Fehler beim Senden:", e);
      toast.error("Fehler beim Senden: " + (e.message || "Unbekannt"));
    } finally {
      setIsSubmitting(false);
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
            BEARBEITUNG
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

  const renderTicketDetail = () => {
    if (!selectedRequest) return null;
    const canReply = selectedRequest.status !== "CLOSED";

    return (
      <div className="flex flex-col h-full">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit mb-3 -ml-2 text-muted-foreground"
          onClick={handleBackToList}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Zurück zur Übersicht
        </Button>

        <div className="flex items-start justify-between mb-3 shrink-0">
          <h4 className="font-semibold text-base">{selectedRequest.subject}</h4>
          {getStatusBadge(selectedRequest.status)}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="flex justify-end">
            <div className="max-w-[85%] space-y-1">
              <div className="flex items-center justify-end gap-1.5 mr-1">
                <span className="text-xs text-muted-foreground">
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold bg-primary/15 text-primary rounded-full px-2 py-0.5">
                  Du
                </span>
              </div>
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap">
                {selectedRequest.message}
              </div>
            </div>
          </div>

          {threadLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            threadMessages.map((msg) => {
              const isUser = msg.sender_role === "user";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    isUser ? "justify-end" : "justify-start",
                  )}
                >
                  <div className="max-w-[85%] space-y-1">
                    <div
                      className={cn(
                        "flex items-center gap-1.5",
                        isUser ? "justify-end mr-1" : "ml-1",
                      )}
                    >
                      {!isUser && (
                        <span className="text-[10px] font-semibold bg-blue-500/15 text-blue-600 rounded-full px-2 py-0.5">
                          Support
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                      {isUser && (
                        <span className="text-[10px] font-semibold bg-primary/15 text-primary rounded-full px-2 py-0.5">
                          Du
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                        isUser
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted/50 border rounded-tl-sm",
                      )}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {canReply && (
          <div className="shrink-0 border-t pt-3 mt-2 flex flex-col gap-2">
            <Textarea
              placeholder="Antwort schreiben..."
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={isReplying}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Antworte dem Support-Team
              </p>
              <Button
                size="sm"
                onClick={handleUserReply}
                disabled={isReplying || !replyText.trim()}
              >
                {isReplying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Antworten
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRequestList = (statusFilter: string[] | null) => {
    const filtered = statusFilter
      ? requests.filter((r) => statusFilter.includes(r.status))
      : requests;

    if (loading) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8 border rounded-lg border-dashed">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p>Keine Anfragen gefunden.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filtered.map((req) => (
          <button
            key={req.id}
            onClick={() => handleTicketClick(req)}
            className="w-full text-left border rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-semibold text-sm mr-2">{req.subject}</h4>
              {getStatusBadge(req.status)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(req.created_at).toLocaleString()}
            </p>
            <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
              {req.message}
            </p>
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Hilfe & Support
          </DialogTitle>
          <DialogDescription className="text-center pt-1">
            Reiche eine neue Anfrage ein oder verfolge den Status deiner
            bisherigen Tickets.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col mt-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-full"
          >
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="new">Neue Anfrage</TabsTrigger>
              <TabsTrigger value="mine">Meine Anfragen</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4 pr-1">
              <TabsContent value="new" className="mt-0 h-full">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Betreff / Thema
                    </label>
                    <Input
                      placeholder="Zusammenfassung deines Anliegens"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nachricht</label>
                    <Textarea
                      placeholder="Bitte beschreibe dein Problem hier so genau wie möglich..."
                      rows={8}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                      className="mr-2"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting || !subject.trim() || !message.trim()
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                          Senden...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" /> Anfrage senden
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="mine" className="mt-0 h-full flex flex-col">
                {selectedRequest ? (
                  renderTicketDetail()
                ) : (
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b rounded-none p-0 mb-4 h-auto">
                      <TabsTrigger
                        value="all"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none"
                      >
                        Alle
                      </TabsTrigger>
                      <TabsTrigger
                        value="open"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none text-red-500"
                      >
                        Offen
                      </TabsTrigger>
                      <TabsTrigger
                        value="progress"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none text-yellow-600"
                      >
                        In Bearbeitung
                      </TabsTrigger>
                      <TabsTrigger
                        value="closed"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none text-emerald-500"
                      >
                        Geschlossen
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="mt-0">
                      {renderRequestList(null)}
                    </TabsContent>
                    <TabsContent value="open" className="mt-0">
                      {renderRequestList(["OPEN"])}
                    </TabsContent>
                    <TabsContent value="progress" className="mt-0">
                      {renderRequestList(["IN_PROGRESS"])}
                    </TabsContent>
                    <TabsContent value="closed" className="mt-0">
                      {renderRequestList(["CLOSED"])}
                    </TabsContent>
                  </Tabs>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
