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
import { supabase } from "@/services/supabaseCollum/client";
import { createStripeCheckoutSession } from "@/services/stripeFunctions";
import { deleteReactionContract } from "@/services/supabaseCollum/reactionContract";
import { toast } from "sonner";
import { useDashboardStats } from "@/hooks/queries/useDashboardStats";
import { useOpenInvoices } from "@/hooks/queries/useOpenInvoices";
import type { ReactionContract } from "@/services/supabaseCollum/reactionContract";
import { useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  FileCheck,
  Search,
  CreditCard,
  Loader2,
  Receipt,
  ExternalLink,
} from "lucide-react";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const alertShown = useRef(false);

  const queryClient = useQueryClient();
  const [viewRole, setViewRole] = useState<"creator" | "reactor">("creator");

  const { data: statsData, isLoading: loadingStats } = useDashboardStats(
    user?.id,
  );

  const { data: invoicesData, isLoading: loadingInvoices } = useOpenInvoices(
    user?.id,
  );

  const profile = statsData?.profile;
  const stats = statsData?.stats || {
    totalEarnings: 0,
    totalSpent: 0,
    activeContracts: 0,
    pendingRequests: 0,
  };
  const openInvoices = invoicesData || [];
  const [payingId, setPayingId] = useState<string | null>(null);
  const [pollingContractId, setPollingContractId] = useState<string | null>(
    null,
  );

  // Handle Stripe redirect params
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const contractId = searchParams.get("contractId");

    if (alertShown.current) return;

    if (success) {
      alertShown.current = true;
      toast.success("Zahlung erfolgreich!", {
        description: "Deine Zahlung wird verarbeitet.",
      });

      // Invalidate queries to refresh data and remove the paid contract from list
      if (contractId) {
        if (user) {
          queryClient.invalidateQueries({
            queryKey: ["openInvoices", user.id],
          });
          queryClient.invalidateQueries({
            queryKey: ["dashboardStats", user.id],
          });
        }
        setPollingContractId(contractId);

        // Poll until the webhook has updated the status to ACTIVE/PAID (max 10 attempts × 2s)
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          const { data } = await supabase
            .from("reaction_contracts")
            .select("id, status")
            .eq("id", contractId)
            .maybeSingle();

          const isSettled =
            data?.status === "ACTIVE" || data?.status === "PAID";
          if (isSettled || attempts >= 10) {
            clearInterval(pollInterval);
            setPollingContractId(null);

            if (isSettled && attempts > 1) {
              // Only toast if we waited
              toast.success("Lizenz aktiviert", {
                description: "Stripe Webhook Verarbeitung abgeschlossen.",
              });
            }

            if (user) {
              // Invalidate queries to refresh data
              queryClient.invalidateQueries({
                queryKey: ["openInvoices", user.id],
              });
              queryClient.invalidateQueries({
                queryKey: ["dashboardStats", user.id],
              });
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
        <p className="text-muted-foreground mt-1 mb-6">
          Hier ist dein persönlicher Überblick über alles rund um SimpleShare.
        </p>

        {/* Role Toggle */}
        <div className="inline-flex items-center bg-muted/50 p-1.5 rounded-xl border border-border/50 shadow-sm">
          <button
            onClick={() => setViewRole("creator")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              viewRole === "creator"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Meine Einnahmen als Creator
          </button>
          <button
            onClick={() => setViewRole("reactor")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              viewRole === "reactor"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Meine Ausgaben als Reactor
            {openInvoices.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                {openInvoices.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {viewRole === "creator" ? (
          <>
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
                  Aus Lizenzen für deine Videos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Verkaufte Lizenzen
                </CardTitle>
                <FileCheck className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-2xl font-bold">
                    {stats.activeContracts}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Aktiv & Bezahlt
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
                  <div className="text-2xl font-bold">
                    {stats.pendingRequests}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Warten auf deine Freigabe
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
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
                  Für gekaufte React-Lizenzen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Erworbene Lizenzen
                </CardTitle>
                <FileCheck className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-2xl font-bold">
                    {stats.activeContracts}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Aktiv & Bezahlt
                </p>
              </CardContent>
            </Card>

            <Card
              className={
                openInvoices.length > 0 ? "border-rose-500/60 bg-rose-50/5" : ""
              }
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Zahlung ausstehend
                </CardTitle>
                <Receipt
                  className={`w-4 h-4 ${openInvoices.length > 0 ? "text-rose-500" : "text-muted-foreground"}`}
                />
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-2xl font-bold">
                    {openInvoices.length}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Noch nicht bezahlte Lizenzen
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Reactor View: Open Invoices & Subscriptions */}
      {viewRole === "reactor" &&
        (loadingInvoices || openInvoices.length > 0) &&
        (() => {
          const oneTimeInvoices = openInvoices.filter(
            (i: ReactionContract) => i.pricing_model_type === 1,
          );
          const subscriptionInvoices = openInvoices.filter(
            (i: ReactionContract) => i.pricing_model_type !== 1,
          );
          return (
            <Card className="mb-8 border-rose-500/40 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-rose-50/30 dark:bg-rose-950/20 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-100 dark:bg-rose-900 rounded-md">
                    <Receipt className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <CardTitle className="text-base text-rose-900 dark:text-rose-100">
                    Offene Zahlungen
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingInvoices ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-8">
                    <Loader2 className="h-4 w-4 animate-spin" /> Lade
                    Rechnungen...
                  </div>
                ) : (
                  <Tabs
                    defaultValue={
                      oneTimeInvoices.length > 0 ? "invoices" : "subscriptions"
                    }
                    className="w-full"
                  >
                    <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border/50 h-11 bg-transparent">
                      <TabsTrigger
                        value="invoices"
                        className="text-sm border-b-2 border-transparent data-[state=active]:border-rose-500 rounded-none bg-transparent data-[state=active]:shadow-none"
                      >
                        Einmalig
                        {oneTimeInvoices.length > 0 && (
                          <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold bg-rose-500 text-white rounded-full px-1">
                            {oneTimeInvoices.length}
                          </span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="subscriptions"
                        className="text-sm border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none bg-transparent data-[state=active]:shadow-none"
                      >
                        Views-basiert
                        {subscriptionInvoices.length > 0 && (
                          <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold bg-blue-500 text-white rounded-full px-1">
                            {subscriptionInvoices.length}
                          </span>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value="invoices"
                      className="p-4 m-0 border-none outline-none"
                    >
                      {oneTimeInvoices.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Keine offenen Einmalzahlungen.
                        </p>
                      ) : (
                        <div className="divide-y space-y-2">
                          {oneTimeInvoices.map((invoice: ReactionContract) => (
                            <div
                              key={invoice.id}
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 gap-4 group"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {invoice.original_video_title}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-medium px-2 py-0 border-transparent"
                                  >
                                    Festpreis
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    von{" "}
                                    <span className="font-medium text-foreground">
                                      {invoice.licensor_name}
                                    </span>
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ·{" "}
                                    {new Date(
                                      invoice.created_at,
                                    ).toLocaleDateString("de-DE")}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 shrink-0 sm:w-auto w-full justify-between">
                                <span className="text-base font-bold text-foreground">
                                  {invoice.pricing_value.toFixed(2)}{" "}
                                  {invoice.pricing_currency?.toUpperCase() ||
                                    "EUR"}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => handlePay(invoice.id)}
                                  disabled={
                                    payingId === invoice.id ||
                                    pollingContractId === invoice.id
                                  }
                                  className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all group-hover:shadow-md"
                                >
                                  {payingId === invoice.id ||
                                  pollingContractId === invoice.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                  ) : (
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                  )}
                                  {pollingContractId === invoice.id
                                    ? "Wird verarbeitet..."
                                    : "Bezahlen"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent
                      value="subscriptions"
                      className="p-4 m-0 border-none outline-none"
                    >
                      {subscriptionInvoices.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Keine offenen Abonnements.
                        </p>
                      ) : (
                        <div className="divide-y space-y-2">
                          {subscriptionInvoices.map(
                            (invoice: ReactionContract) => (
                              <div
                                key={invoice.id}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 gap-4 group"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">
                                    {invoice.original_video_title}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-medium text-blue-600 border-blue-200 bg-blue-50/50 px-2 py-0"
                                    >
                                      Views-basiert
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      von{" "}
                                      <span className="font-medium text-foreground">
                                        {invoice.licensor_name}
                                      </span>
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ·{" "}
                                      {new Date(
                                        invoice.created_at,
                                      ).toLocaleDateString("de-DE")}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0 sm:w-auto w-full justify-between">
                                  <div className="text-right">
                                    <span className="text-base font-bold text-foreground block">
                                      {invoice.pricing_value.toFixed(2)}{" "}
                                      {invoice.pricing_currency?.toUpperCase() ||
                                        "EUR"}
                                    </span>
                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block mt-0.5">
                                      pro 1.000 Aufrufe
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handlePay(invoice.id)}
                                    disabled={
                                      payingId === invoice.id ||
                                      pollingContractId === invoice.id
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all group-hover:shadow-md"
                                  >
                                    {payingId === invoice.id ||
                                    pollingContractId === invoice.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                    ) : (
                                      <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    <span className="hidden sm:inline">
                                      {pollingContractId === invoice.id
                                        ? "Verarbeitet..."
                                        : "Abo abschließen"}
                                    </span>
                                    <span className="sm:hidden">
                                      {pollingContractId === invoice.id
                                        ? "Warten..."
                                        : "Abschließen"}
                                    </span>
                                  </Button>
                                </div>
                              </div>
                            ),
                          )}
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
        {/* 
        <Button onClick={() => navigate("/upload")} variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Videos importieren
        </Button>
        */}
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

      <Tabs
        defaultValue={viewRole === "creator" ? "analytics" : "licenses"}
        className="w-full"
        key={viewRole}
      >
        <TabsList className="mb-6 flex-wrap h-auto bg-muted/30 border border-border/50 p-1">
          {viewRole === "creator" ? (
            <>
              <TabsTrigger value="analytics">Umsatz-Übersicht</TabsTrigger>
              <TabsTrigger
                value="creator-requests"
                className="flex items-center gap-1.5"
              >
                Neue Anfragen
                {stats.pendingRequests > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-yellow-500 text-white rounded-full">
                    {stats.pendingRequests}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="creator-active">Aktive Lizenzen</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="licenses">
                Meine gekauften Lizenzen
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="analytics">
          <Analytics />
        </TabsContent>
        <TabsContent value="licenses">
          <MyLicenses />
        </TabsContent>
        <TabsContent value="creator-requests">
          <CreatorContracts mode="requests" />
        </TabsContent>
        <TabsContent value="creator-active">
          <CreatorContracts mode="active" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
