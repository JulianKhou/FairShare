import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MyLicenses } from "@/components/profile/MyLicenses";
import { CreatorContracts } from "@/components/profile/CreatorContracts";
import { Analytics } from "@/components/profile/Analytics";
import { getProfile } from "@/services/supabaseCollum/profiles";
import { supabase } from "@/services/supabaseCollum/client";
import { createStripeCheckoutSession } from "@/services/stripeFunctions";
import { deleteReactionContract } from "@/services/supabaseCollum/reactionContract";
import { toast } from "sonner";
import type { ReactionContract } from "@/services/supabaseCollum/reactionContract";
import {
  TrendingUp,
  TrendingDown,
  FileCheck,
  Search,
  Upload,
  CreditCard,
  Loader2,
  Receipt,
  ExternalLink,
} from "lucide-react";

interface DashboardStats {
  totalEarnings: number;
  totalSpent: number;
  activeContracts: number;
  pendingRequests: number;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const alertShown = useRef(false);

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    totalSpent: 0,
    activeContracts: 0,
    pendingRequests: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [openInvoices, setOpenInvoices] = useState<ReactionContract[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Handle Stripe redirect params
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const contractId = searchParams.get("contractId");

    if (alertShown.current) return;

    if (success) {
      alertShown.current = true;
      toast.success("Zahlung erfolgreich!", {
        description: "Deine Lizenz wurde erfolgreich erstellt.",
      });

      // Immediately remove the paid contract from open invoices (webhook may be delayed)
      if (contractId) {
        setOpenInvoices((prev) => prev.filter((inv) => inv.id !== contractId));

        // Poll until the webhook has updated the status to ACTIVE/PAID (max 10 attempts × 2s)
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          const { data } = await supabase
            .from("reaction_contracts")
            .select("id, status")
            .eq("id", contractId)
            .maybeSingle();

          const isSettled = data?.status === "ACTIVE" || data?.status === "PAID";
          if (isSettled || attempts >= 10) {
            clearInterval(pollInterval);
            // Final refresh of open invoices to ensure clean state
            if (user) {
              const { data: freshInvoices } = await supabase
                .from("reaction_contracts")
                .select("*")
                .eq("licensee_id", user.id)
                .eq("accepted_by_licensor", true)
                .eq("status", "PENDING")
                .order("created_at", { ascending: false });
              setOpenInvoices((freshInvoices as ReactionContract[]) || []);
            }
          }
        }, 2000);
      }

      setSearchParams({}, { replace: true });
    }

    if (canceled) {
      alertShown.current = true;
      if (contractId) {
        deleteReactionContract(contractId)
          .then(() => {
            toast.info("Zahlung abgebrochen", {
              description: "Die ausstehende Anfrage wurde gelöscht.",
            });
          })
          .catch((err) => {
            console.error("Failed to delete contract:", err);
            toast.error("Zahlung abgebrochen", {
              description:
                "Die ausstehende Anfrage konnte nicht gelöscht werden.",
            });
          });
      } else {
        toast.info("Zahlung abgebrochen");
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoadingStats(true);
      setLoadingInvoices(true);

      const [
        profileData,
        contractsLicensor,
        contractsLicensee,
        revLicensorData,
        revLicenseeData,
        activeData,
        pendingData,
        invoicesData,
      ] = await Promise.allSettled([
        getProfile(user.id),
        supabase
          .from("reaction_contracts")
          .select("id, pricing_value")
          .eq("licensor_id", user.id)
          .in("status", ["PAID", "ACTIVE"]),
        supabase
          .from("reaction_contracts")
          .select("id, pricing_value")
          .eq("licensee_id", user.id)
          .in("status", ["PAID", "ACTIVE"]),
        supabase
          .from("revenue_events")
          .select("contract_id, amount_cents")
          .eq("licensor_id", user.id),
        supabase
          .from("revenue_events")
          .select("contract_id, amount_cents")
          .eq("licensee_id", user.id),
        supabase
          .from("reaction_contracts")
          .select("id", { count: "exact", head: true })
          .or(`licensor_id.eq.${user.id},licensee_id.eq.${user.id}`)
          .in("status", ["PAID", "ACTIVE"]),
        supabase
          .from("reaction_contracts")
          .select("id", { count: "exact", head: true })
          .eq("licensor_id", user.id)
          .eq("accepted_by_licensor", false)
          .neq("status", "REJECTED"),
        // Open Invoices: contracts where I am licensee, accepted by licensor, but not yet paid
        // Exclude contracts that already have a stripe_subscription_id (checkout completed, webhook pending)
        supabase
          .from("reaction_contracts")
          .select("*")
          .eq("licensee_id", user.id)
          .eq("accepted_by_licensor", true)
          .eq("status", "PENDING")
          .is("stripe_subscription_id", null)
          .order("created_at", { ascending: false }),
      ]);

      if (profileData.status === "fulfilled") setProfile(profileData.value);

      // Map accumulated revenue by contract ID
      const revenuesLicensor: Record<string, number> = {};
      if (revLicensorData.status === "fulfilled" && revLicensorData.value.data) {
        revLicensorData.value.data.forEach((r: any) => {
          if (!revenuesLicensor[r.contract_id]) revenuesLicensor[r.contract_id] = 0;
          revenuesLicensor[r.contract_id] += r.amount_cents / 100;
        });
      }

      const revenuesLicensee: Record<string, number> = {};
      if (revLicenseeData.status === "fulfilled" && revLicenseeData.value.data) {
        revLicenseeData.value.data.forEach((r: any) => {
          if (!revenuesLicensee[r.contract_id]) revenuesLicensee[r.contract_id] = 0;
          revenuesLicensee[r.contract_id] += r.amount_cents / 100;
        });
      }

      // Calculate total earnings (fallback to pricing_value if no revenue event exists)
      let earnings = 0;
      if (contractsLicensor.status === "fulfilled" && contractsLicensor.value.data) {
        contractsLicensor.value.data.forEach((c: any) => {
          earnings += revenuesLicensor[c.id] !== undefined && revenuesLicensor[c.id] > 0
            ? revenuesLicensor[c.id]
            : c.pricing_value || 0;
        });
      }

      // Calculate total spent (fallback to pricing_value if no revenue event exists)
      let spent = 0;
      if (contractsLicensee.status === "fulfilled" && contractsLicensee.value.data) {
        contractsLicensee.value.data.forEach((c: any) => {
          spent += revenuesLicensee[c.id] !== undefined && revenuesLicensee[c.id] > 0
            ? revenuesLicensee[c.id]
            : c.pricing_value || 0;
        });
      }

      const active =
        activeData.status === "fulfilled" ? activeData.value.count || 0 : 0;
      const pending =
        pendingData.status === "fulfilled" ? pendingData.value.count || 0 : 0;

      setStats({
        totalEarnings: earnings,
        totalSpent: spent,
        activeContracts: active,
        pendingRequests: pending,
      });
      setLoadingStats(false);

      if (invoicesData.status === "fulfilled" && invoicesData.value.data) {
        setOpenInvoices(invoicesData.value.data as ReactionContract[]);
      }
      setLoadingInvoices(false);
    };

    fetchData();
  }, [user]);

  const handlePay = async (contractId: string) => {
    setPayingId(contractId);
    try {
      const { url } = await createStripeCheckoutSession(contractId);
      window.location.href = url;
    } catch (e: any) {
      toast.error("Zahlung fehlgeschlagen: " + e.message);
      setPayingId(null);
    }
  };

  if (!user) return null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const pricingModelLabel = (type: number) => {
    if (type === 1) return "Festpreis";
    if (type === 2) return "Views-basiert";
    return "CPM-basiert";
  };

  return (
    <div className="container mx-auto max-w-6xl py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting()},{" "}
          <span className="text-primary">
            {profile?.full_name || user.email?.split("@")[0] || "Creator"}
          </span>{" "}
          👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Hier ist dein persönlicher Überblick über alles rund um SimpleShare.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamteinnahmen
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">
                {stats.totalEarnings.toFixed(2)} €
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Aus bezahlten Lizenzen (als Creator)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtausgaben
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">
                {stats.totalSpent.toFixed(2)} €
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Für gekaufte Lizenzen (als Reactor)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive Lizenzen
            </CardTitle>
            <FileCheck className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{stats.activeContracts}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Bezahlte Verträge für deine Videos
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            stats.pendingRequests > 0
              ? "border-yellow-500/60 bg-yellow-50/5"
              : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offene Anfragen
            </CardTitle>
            <span
              className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${stats.pendingRequests > 0 ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground"}`}
            >
              {stats.pendingRequests}
            </span>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Lizenzanfragen warten auf Genehmigung
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Open Invoices & Subscriptions Section */}
      {(loadingInvoices || openInvoices.length > 0) && (() => {
        const oneTimeInvoices = openInvoices.filter((i) => i.pricing_model_type === 1);
        const subscriptionInvoices = openInvoices.filter((i) => i.pricing_model_type !== 1);
        return (
          <Card className="mb-8 border-rose-500/40">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-500" />
                <CardTitle className="text-base">
                  Offene Zahlungen
                  {openInvoices.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-rose-500 text-white rounded-full">
                      {openInvoices.length}
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loadingInvoices ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Lade Rechnungen...
                </div>
              ) : (
                <Tabs defaultValue={oneTimeInvoices.length > 0 ? "invoices" : "subscriptions"} className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="invoices" className="text-sm">
                      Offene Rechnungen
                      {oneTimeInvoices.length > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold bg-rose-500 text-white rounded-full px-1">
                          {oneTimeInvoices.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="subscriptions" className="text-sm">
                      Abonnements
                      {subscriptionInvoices.length > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold bg-blue-500 text-white rounded-full px-1">
                          {subscriptionInvoices.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="invoices" className="mt-0">
                    {oneTimeInvoices.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Keine offenen Rechnungen.</p>
                    ) : (
                      <div className="divide-y">
                        {oneTimeInvoices.map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between py-3 gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{invoice.original_video_title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">Festpreis</Badge>
                                <span className="text-xs text-muted-foreground">von {invoice.licensor_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  · {new Date(invoice.created_at).toLocaleDateString("de-DE")}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-bold">
                                {invoice.pricing_value.toFixed(2)} {invoice.pricing_currency?.toUpperCase() || "EUR"}
                              </span>
                              <Button size="sm" onClick={() => handlePay(invoice.id)} disabled={payingId === invoice.id}>
                                {payingId === invoice.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                ) : (
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                )}
                                Jetzt bezahlen
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="subscriptions" className="mt-0">
                    {subscriptionInvoices.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Keine offenen Abonnements.</p>
                    ) : (
                      <div className="divide-y">
                        {subscriptionInvoices.map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between py-3 gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{invoice.original_video_title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs text-blue-600 border-blue-500">
                                  Views-basiert
                                </Badge>
                                <span className="text-xs text-muted-foreground">von {invoice.licensor_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  · {new Date(invoice.created_at).toLocaleDateString("de-DE")}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-bold">
                                {invoice.pricing_value.toFixed(2)} {invoice.pricing_currency?.toUpperCase() || "EUR"}
                                <span className="text-xs font-normal text-muted-foreground ml-1">/ 1000 Views</span>
                              </span>
                              <Button size="sm" onClick={() => handlePay(invoice.id)} disabled={payingId === invoice.id}>
                                {payingId === invoice.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                ) : (
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                )}
                                Abo abschließen
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button onClick={() => navigate("/overview")} variant="outline">
          <Search className="w-4 h-4 mr-2" />
          Videos erkunden
        </Button>
        <Button onClick={() => navigate("/upload")} variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Videos importieren
        </Button>
        {profile?.stripe_connect_id && (
          <Button asChild variant="outline">
            <a
              href="https://connect.stripe.com/express_login"
              target="_blank"
              rel="noopener noreferrer"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Stripe Payouts
            </a>
          </Button>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="licenses">Aktive Lizenzen</TabsTrigger>
          <TabsTrigger value="license-history">Abgelaufene Lizenzen</TabsTrigger>
          <TabsTrigger value="creator-requests">
            Creator Anfragen
            {stats.pendingRequests > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-yellow-500 text-white rounded-full">
                {stats.pendingRequests}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <Analytics />
        </TabsContent>
        <TabsContent value="licenses">
          <MyLicenses filter="active" />
        </TabsContent>
        <TabsContent value="license-history">
          <MyLicenses filter="expired" />
        </TabsContent>
        <TabsContent value="creator-requests">
          <CreatorContracts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
