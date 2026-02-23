import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  Activity,
  CreditCard,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAllProfiles } from "@/services/supabaseCollum/profiles";
import {
  getAllReactionContracts,
  ReactionContract,
} from "@/services/supabaseCollum/reactionContract";
import { getAllHelpRequests } from "@/services/supabaseCollum/helpRequests";
import { supabase } from "@/services/supabaseCollum/client";
import { RevenueChart } from "./components/RevenueChart";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLicenses: 0,
    pendingLicenses: 0,
    totalRevenue: 0,
    openSupportTickets: 0,
  });
  const [rawContracts, setRawContracts] = useState<ReactionContract[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [profiles, contracts, helpRequests] = await Promise.all([
          getAllProfiles(),
          getAllReactionContracts(),
          getAllHelpRequests(),
        ]);

        const totalUsers = (profiles || []).length;

        let activeLicenses = 0;
        let pendingLicenses = 0;
        let totalRevenue = 0;

        (contracts || []).forEach((c) => {
          if (c.status === "ACTIVE" || c.status === "PAID") {
            activeLicenses++;
            totalRevenue += c.pricing_value;
          } else if (c.status === "PENDING" || !c.accepted_by_licensor) {
            pendingLicenses++;
          }
        });

        // Berechne 10% Plattformgebühr (Beispielhaft)
        const platformRevenue = totalRevenue * 0.1;

        // Support Tickets berechnen
        const openSupportTickets = (helpRequests || []).filter(
          (req) => req.status === "OPEN",
        ).length;

        setStats({
          totalUsers,
          activeLicenses,
          pendingLicenses,
          totalRevenue: platformRevenue,
          openSupportTickets,
        });
        setRawContracts(contracts || []);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Subscribe to realtime changes on reaction_contracts
    const contractsChannel = supabase
      .channel("admin-dashboard-contracts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reaction_contracts" },
        () => {
          // Whenever a contract is created, updated, or deleted, refetch stats
          fetchStats();
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
          // Whenever a profile is created or deleted, refetch stats
          fetchStats();
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
          // Whenever a request is created or updated, refetch stats
          fetchStats();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(helpRequestsChannel);
    };
  }, []);

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
