import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  Activity,
  CreditCard,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/services/supabaseCollum/client";
import { RevenueChart } from "./components/RevenueChart";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminDashboardStats } from "@/hooks/queries/useAdminDashboardStats";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading: loading } = useAdminDashboardStats();

  const stats = data?.stats || {
    totalUsers: 0,
    activeLicenses: 0,
    pendingLicenses: 0,
    totalRevenue: 0,
    openSupportTickets: 0,
  };
  const rawContracts = data?.rawContracts || [];

  useEffect(() => {
    // Subscribe to realtime changes on reaction_contracts
    const contractsChannel = supabase
      .channel("admin-dashboard-contracts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reaction_contracts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
        },
      )
      .subscribe();

    // Subscribe to realtime changes on profiles
    const profilesChannel = supabase
      .channel("admin-dashboard-profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
        },
      )
      .subscribe();

    // Subscribe to realtime changes on help_requests
    const helpRequestsChannel = supabase
      .channel("admin-dashboard-help-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "help_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(helpRequestsChannel);
    };
  }, [queryClient]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Übersicht</h1>
      <p className="text-muted-foreground">
        Willkommen im Admin-Panel von SimpleShare.
      </p>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Gesamte User
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registrierte Accounts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Aktive Lizenzen
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLicenses}</div>
              <p className="text-xs text-muted-foreground">
                Erfolgreich abgewickelt
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Ausstehende Anfragen
              </CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingLicenses}</div>
              <p className="text-xs text-yellow-600">Warten auf Bestätigung</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Plattform Umsatz
              </CardTitle>
              <CreditCard className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                € {stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                10% Gebühr (geschätzt)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Support-Tickets
              </CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.openSupportTickets}
              </div>
              <p className="text-xs text-red-500">Offene Anfragen</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Umsatzverlauf (Letzte 7 Tage)</CardTitle>
          </CardHeader>
          <CardContent className="h-80 pl-2">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <RevenueChart contracts={rawContracts} />
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Kürzliche Transaktionen (Demnächst)</CardTitle>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center text-muted-foreground border-t bg-muted/10">
            Transaktions-Feed Platzhalter
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
