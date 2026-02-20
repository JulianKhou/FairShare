import { useState } from "react";
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
import { Loader2, Send, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { createHelpRequest } from "@/services/supabaseCollum/helpRequests";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await createHelpRequest(subject, message);
      toast.success("Deine Anfrage wurde erfolgreich abgeschickt!");
      setSubject("");
      setMessage("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Fehler beim Senden:", error);
      toast.error("Fehler beim Senden: " + (error.message || "Unbekannt"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Hilfe & Support
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Hast du ein technisches Problem oder Fragen zu einer Lizenz?
            Beschreibe dein Anliegen kurz und unser Team wird sich darum
            kümmern.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
              rows={5}
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
      </DialogContent>
    </Dialog>
  );
}
