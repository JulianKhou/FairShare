import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  getPurchasedContracts,
  ReactionContract,
} from "@/services/supabaseCollum/reactionContract";
import { Loader2, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadLicensePDF } from "@/services/supabaseFunctions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const MyLicenses = () => {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<ReactionContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh logic for incoming payments
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setLoading(true);
      // Poll every 2 seconds for 10 seconds
      let attempts = 0;
      const interval = setInterval(() => {
        if (!user) return;
        attempts++;
        getPurchasedContracts(user.id).then((data) => {
          if (data && data.some((l) => l.status === "PAID")) {
            setLicenses(data);
            // If we found a paid license, we can stop polling (optionally)
            // But let's just let the interval finish or clear it if needed
          } else {
            setLicenses(data || []);
          }
        });

        if (attempts >= 5) {
          clearInterval(interval);
          setLoading(false);
          // Clean URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getPurchasedContracts(user.id)
        .then((data) => {
          // fallback for legacy/manual entries: check accepted_by_licensor if status is missing
          const validLicenses = data || [];
          console.log("Fetched licenses:", validLicenses); // DEBUG: Check status values
          validLicenses.forEach(l => console.log(`License ${l.id} pdf_storage_path:`, l.pdf_storage_path));
          if (data?.length === 0) {
            // You might want to remove this fallback later if strictly using status
          }
          setLicenses(validLicenses);
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to load licenses.");
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleDownload = async (license: ReactionContract) => {
    try {
      // Show loading indicator if needed (simulated by async/await for now)
      // Ideally we'd modify the state to show a spinner on the specific button
      
      const fileName = `License-${license.id.slice(0, 8)}.pdf`;
      await downloadLicensePDF(license.id, fileName, license.pdf_storage_path);
      
    } catch (e: any) {
      alert(`Failed to download license: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (licenses.length === 0) {
    return (
      <Card className="text-center p-8 border-dashed">
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You haven't purchased any licenses yet.
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/explore")}
          >
            Browse Videos
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {licenses.map((license) => (
        <Card key={license.id} className="overflow-hidden">
          <CardHeader className="bg-gray-50/50 pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  {license.original_video_title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Licensor: {license.licensor_name}
                </p>
              </div>
              <Badge
                variant={
                  license.status === "PAID"
                    ? "default"
                    : license.status === "PENDING"
                      ? "outline"
                      : "secondary"
                }
                className={
                  license.status === "PENDING"
                    ? "text-yellow-600 border-yellow-600"
                    : ""
                }
              >
                {license.status || "Active"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Price:</span>{" "}
                {license.pricing_value} {license.pricing_currency}
              </p>
              <p>
                <span className="font-medium">Purchased:</span>{" "}
                {new Date(license.created_at).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Contract ID:</span>{" "}
                <span className="font-mono text-xs">
                  {license.id.slice(0, 8)}...
                </span>
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() =>
                  window.open(license.original_video_url, "_blank")
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Watch Video
              </Button>
              <Button
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => handleDownload(license)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download License
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
