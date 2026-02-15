import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyLicenses } from "@/components/profile/MyLicenses";
import { Analytics } from "@/components/profile/Analytics";

export default function ProfilePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  // Default to 'analytics' instead of 'settings'
  const currentTab = searchParams.get("tab") || "analytics";

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      <Tabs
        value={currentTab}
        onValueChange={(value) => setSearchParams({ tab: value })}
        className="w-full"
      >
        <TabsList className="mb-8">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="licenses">My Licenses</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses">
          <MyLicenses />
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
