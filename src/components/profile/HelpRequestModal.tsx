import { useState, useEffect } from "react";
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
import { Loader2, Send, HelpCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  createHelpRequest,
  getUserHelpRequests,
  HelpRequest,
} from "@/services/supabaseCollum/helpRequests";
import { supabase } from "@/services/supabaseCollum/client";

interface HelpRequestModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpRequestModal({
  isOpen,
  onOpenChange,
}: HelpRequestModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState("new");
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === "mine") {
      fetchMyRequests();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel("user-support-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "help_requests" },
        () => {
          if (activeTab === "mine") {
            fetchMyRequests();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, activeTab]);

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await getUserHelpRequests();
      setMyRequests(data);
    } catch (error) {
      console.error("Fehler beim Laden der Anfragen:", error);
      toast.error("Fehler beim Laden deiner Anfragen.");
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await createHelpRequest(subject, message);
      toast.success("Deine Anfrage wurde erfolgreich abgeschickt!");
      setSubject("");
      setMessage("");
      setActiveTab("mine"); // Switch to "Meine Anfragen" tab after successful submission
    } catch (error: any) {
      console.error("Fehler beim Senden:", error);
      toast.error("Fehler beim Senden: " + (error.message || "Unbekannt"));
    } finally {
      setSubmitting(false);
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

  const renderRequestList = (statusFilter: string[] | null) => {
    const filtered = statusFilter
      ? myRequests.filter((r) => statusFilter.includes(r.status))
      : myRequests;

    if (loadingRequests) {
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
          <div key={req.id} className="border rounded-lg p-4 bg-muted/20">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-sm mr-2">{req.subject}</h4>
              {getStatusBadge(req.status)}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {new Date(req.created_at).toLocaleString()}
            </p>
            <div className="text-sm bg-background p-3 rounded border whitespace-pre-wrap">
              {req.message}
            </div>
          </div>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">Neue Anfrage</TabsTrigger>
              <TabsTrigger value="mine">Meine Anfragen</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto mt-4 pr-1">
              <TabsContent value="new" className="mt-0 h-full">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Betreff / Thema</label>
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
                      disabled={submitting || !subject.trim() || !message.trim()}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Senden...
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

              <TabsContent value="mine" className="mt-0 h-full">
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
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none text-red-500 data-[state=active]:text-red-500"
                    >
                      Offen
                    </TabsTrigger>
                    <TabsTrigger
                      value="progress"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none text-yellow-600 data-[state=active]:text-yellow-600"
                    >
                      In Bearbeitung
                    </TabsTrigger>
                    <TabsTrigger
                      value="closed"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none text-emerald-500 data-[state=active]:text-emerald-500"
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
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
