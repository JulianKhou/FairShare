import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabaseCollum/client";
import { updateReactionContract } from "@/services/supabaseCollum/reactionContract";
import { Bell, Check, X, Loader2, CreditCard } from "lucide-react";
import { generateLicensePDF } from "@/services/supabaseFunctions";
import { createStripeCheckoutSession } from "@/services/stripeFunctions";
import { useQueryClient } from "@tanstack/react-query";
import { useIncomingRequests } from "@/hooks/queries/useIncomingRequests";
import { usePaymentDue } from "@/hooks/queries/usePaymentDue";
import { toast } from "sonner";

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // Licensor side: incoming pending requests
  const { data: requestsData } = useIncomingRequests(user?.id);
  const requests = requestsData?.requests || [];
  const licenseeNames = requestsData?.licenseeNames || {};

  // Licensee side: accepted requests waiting for payment
  const { data: paymentDue = [] } = usePaymentDue(user?.id);

  const [isOpen, setIsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Licensor side: incoming requests
    const licensorChannel = supabase
      .channel(`notif-licensor-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reaction_contracts",
          filter: `licensor_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["incomingRequests", user.id],
          });
          queryClient.invalidateQueries({ queryKey: ["paymentDue", user.id] });
        },
      )
      .subscribe();

    // Licensee side: payment-due updates (when licensor accepts or new contracts)
    const licenseeChannel = supabase
      .channel(`notif-licensee-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reaction_contracts",
          filter: `licensee_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["paymentDue", user.id] });
          queryClient.invalidateQueries({
            queryKey: ["incomingRequests", user.id],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(licensorChannel);
      supabase.removeChannel(licenseeChannel);
    };
  }, [user?.id, queryClient]);

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
      try {
        await generateLicensePDF(contractId);
      } catch (pdfErr) {
        console.warn(
          "PDF generation failed, contract was still accepted:",
          pdfErr,
        );
      }
      if (user) {
        queryClient.invalidateQueries({
          queryKey: ["incomingRequests", user.id],
        });
      }
    } catch (e) {
      console.error("Accept failed", e);
      toast.error(e instanceof Error ? e.message : "Fehler beim Akzeptieren.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (contractId: string) => {
    if (!confirm("Anfrage wirklich ablehnen?")) return;
    setActionLoading(contractId);
    try {
      await updateReactionContract(contractId, { status: "REJECTED" as any });
      if (user) {
        queryClient.invalidateQueries({
          queryKey: ["incomingRequests", user.id],
        });
      }
    } catch (e) {
      console.error("Reject failed", e);
      toast.error(e instanceof Error ? e.message : "Fehler beim Ablehnen.");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePay = async (contractId: string) => {
    setPayLoading(contractId);
    try {
      const { url } = await createStripeCheckoutSession(contractId);
      window.location.href = url;
    } catch (e: any) {
      toast.error(
        e instanceof Error ? e.message : "Fehler beim Starten der Zahlung",
      );
      setPayLoading(null);
    }
  };

  const totalCount = requests.length + paymentDue.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors"
        title="Benachrichtigungen"
      >
        <Bell className="h-5 w-5" />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse">
            {totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-sm">
              Benachrichtigungen
              {totalCount > 0 && (
                <span className="ml-2 text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
                  {totalCount}
                </span>
              )}
            </h3>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {totalCount === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Keine offenen Benachrichtigungen
              </div>
            ) : (
              <>
                {/* --- Payment Due Section --- */}
                {paymentDue.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-blue-500/5 border-b border-border/50">
                      <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> Zahlung fällig
                      </p>
                    </div>
                    {paymentDue.map((req) => (
                      <div
                        key={req.id}
                        className="px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium truncate text-blue-500"
                              title={req.original_video_title}
                            >
                              {req.original_video_title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Lizenz von{" "}
                              <span className="font-medium">
                                {req.licensor_name}
                              </span>{" "}
                              akzeptiert!
                            </p>
                            <p className="text-xs font-semibold text-foreground mt-1">
                              {req.pricing_value.toFixed(2)}{" "}
                              {req.pricing_currency}
                            </p>
                          </div>
                          <button
                            onClick={() => handlePay(req.id)}
                            disabled={payLoading === req.id}
                            className="flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                          >
                            {payLoading === req.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CreditCard className="h-3 w-3" />
                            )}
                            Bezahlen
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* --- Incoming Requests Section --- */}
                {requests.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-yellow-500/5 border-b border-border/50">
                      <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">
                        Eingehende Anfragen
                      </p>
                    </div>
                    {requests.map((req) => (
                      <div
                        key={req.id}
                        className="px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/dashboard?tab=creator-requests`);
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
                                {licenseeNames[req.licensee_id] ||
                                  req.licensee_name}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {req.pricing_value.toFixed(2)}{" "}
                              {req.pricing_currency} ·{" "}
                              {new Date(req.created_at).toLocaleDateString(
                                "de-DE",
                              )}
                            </p>
                          </div>

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
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
