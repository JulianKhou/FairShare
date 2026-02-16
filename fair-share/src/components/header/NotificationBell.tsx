import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabaseCollum/client";
import {
  ReactionContract,
  updateReactionContract,
} from "@/services/supabaseCollum/reactionContract";
import { Bell, Check, X, Loader2 } from "lucide-react";
import { generateLicensePDF } from "@/services/supabaseFunctions";

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ReactionContract[]>([]);
  const [licenseeNames, setLicenseeNames] = useState<Record<string, string>>(
    {},
  );
  const [isOpen, setIsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch pending requests where user is the licensor
  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("reaction_contracts")
        .select("*")
        .eq("licensor_id", user.id)
        .eq("accepted_by_licensor", false)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRequests(data);

        // Fetch licensee profiles for display names (YT channel name)
        const ids = [...new Set(data.map((c) => c.licensee_id))];
        if (ids.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", ids);
          if (profiles) {
            const nameMap: Record<string, string> = {};
            profiles.forEach(
              (p) => (nameMap[p.id] = p.full_name || "Unbekannt"),
            );
            setLicenseeNames(nameMap);
          }
        }
      }
    };

    fetchRequests();

    // Realtime subscription for new requests
    const channel = supabase
      .channel("pending-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reaction_contracts",
          filter: `licensor_id=eq.${user.id}`,
        },
        () => fetchRequests(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setRequests((prev) => prev.filter((r) => r.id !== contractId));
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
      setRequests((prev) => prev.filter((r) => r.id !== contractId));
    } catch (e) {
      console.error("Reject failed", e);
      alert("Fehler beim Ablehnen.");
    } finally {
      setActionLoading(null);
    }
  };

  const count = requests.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors"
        title="Benachrichtigungen"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse">
            {count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-sm">
              Eingehende Anfragen
              {count > 0 && (
                <span className="ml-2 text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </h3>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Keine offenen Anfragen
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/profile?tab=creator-requests`);
                  }}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-medium truncate"
                        title={req.original_video_title}
                      >
                        {req.original_video_title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        von{" "}
                        <span className="font-medium">
                          {licenseeNames[req.licensee_id] || req.licensee_name}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {req.pricing_value.toFixed(2)} {req.pricing_currency} ·{" "}
                        {new Date(req.created_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0">
                      {actionLoading === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccept(req.id);
                            }}
                            className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                            title="Akzeptieren"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(req.id);
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            title="Ablehnen"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
