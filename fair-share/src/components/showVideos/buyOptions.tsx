import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { getPrices } from "@/hooks/videoDetails/getPrices";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  createReactionContract,
  ReactionContract,
  checkExistingLicense,
  withdrawReactionContract,
} from "@/services/supabaseCollum/reactionContract";
import { getProfile } from "@/services/supabaseCollum/profiles";
import { useState, useEffect } from "react";
import { generateUUID } from "@/lib/utils";
import { useVideos } from "@/hooks/youtube/useVideos";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface BuyOptionsProps {
  videoCreator: any;
  videoReactor: any;
}

export const BuyOptions = ({ videoCreator, videoReactor }: BuyOptionsProps) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<
    "monthly" | "yearly" | "lifetime"
  >("monthly");
  const [loading, setLoading] = useState(false);
  const [existingContract, setExistingContract] = useState<{
    id: string;
    status: string;
    accepted_by_licensor?: boolean;
  } | null>(null);
  const [checkingLicense, setCheckingLicense] = useState(false);

  // Fetch user's videos for selection
  const { videos: myVideos, isLoading: isLoadingVideos } = useVideos(
    "myVideos",
    user?.id,
  );
  const [selectedReactionVideoId, setSelectedReactionVideoId] =
    useState<string>("");

  // Check for existing license
  useEffect(() => {
    const checkLicense = async () => {
      if (user?.id && videoCreator?.id && selectedReactionVideoId) {
        setCheckingLicense(true);
        try {
          // Now returns object { status, id, accepted_by_licensor } or null
          const result = await checkExistingLicense(
            user.id,
            videoCreator.id,
            selectedReactionVideoId,
          );
          setExistingContract(result);
        } catch (err) {
          console.error("Failed to check license", err);
        } finally {
          setCheckingLicense(false);
        }
      } else {
        setExistingContract(null);
      }
    };

    checkLicense();
  }, [user, videoCreator, selectedReactionVideoId]);

  // Determine which video is selected
  const selectedVideo =
    myVideos.find((v) => v.id === selectedReactionVideoId) || videoReactor;

  // Recalculate prices based on the selected video
  const prices = getPrices(selectedVideo, videoCreator);

  const handleBuy = async () => {
    if (!user) {
      alert("Please log in to purchase a license.");
      return;
    }

    if (!selectedReactionVideoId) {
      alert("Please select a video to license.");
      return;
    }

    setLoading(true);
    try {
      // 1. Check Creator's Auto-Accept Setting
      const creatorProfile = await getProfile(
        videoCreator.creator_id || videoCreator.id,
      );
      const autoAccept = creatorProfile?.auto_accept_reactions ?? false;

      // Map selection to model type and price
      let modelType: 1 | 2 | 3 = 1; // Default Fixed
      let price = prices.oneTime;

      // Determine Pricing Model and Value
      if (selectedPlan === "yearly") {
        modelType = 2; // PayPerView / 1000 Views
        price = prices.payPerViews;
      } else if (selectedPlan === "lifetime") {
        modelType = 3; // CPM
        price = prices.payPerCpm;
      } else {
        modelType = 1; // Fixed (monthly)
        price = prices.oneTime;
      }

      const newContract: ReactionContract = {
        id: generateUUID(),
        created_at: new Date().toISOString(),
        licensor_id: videoCreator.creator_id || videoCreator.id,
        licensee_id: user.id,
        licensor_name: videoCreator.channel_title || "Unknown Creator",
        licensee_name: user.email || "Unknown User",
        original_video_title: videoCreator.title,
        original_video_url: `https://www.youtube.com/watch?v=${videoCreator.id}`,
        original_video_id: videoCreator.id,
        original_video_duration:
          videoCreator.duration_seconds?.toString() || "0",
        pricing_model_type: modelType,
        pricing_value: price,
        pricing_currency: "EUR",
        fairshare_score: 0.5, // Mock default
        fairshare_metadata: {
          marktmacht_score: 0,
          schoepferische_leistung: 0,
          parameter_dokumentation_url: "",
        },
        accepted_by_licensor: autoAccept, // Set based on profile
        accepted_by_licensee: true,
        contract_version: "1.0",
        status: "PENDING",
        reaction_video_id: selectedReactionVideoId,
      };

      // 2. Create Contract in DB
      const customContract = await createReactionContract(newContract);
      const contractId = customContract?.id || newContract.id;

      if (!autoAccept) {
        // If NOT auto-accepted, stop here and show Pending UI
        setExistingContract({
          id: contractId,
          status: "PENDING",
          accepted_by_licensor: false,
        });
        return;
      }

      // 3. If Auto-Accepted, Proceed to Stripe
      const { url } = await import("@/services/stripeFunctions").then((mod) =>
        mod.createStripeCheckoutSession(contractId),
      );

      if (url) {
        window.location.href = url;
      } else {
        alert("Fehler beim Erstellen der Checkout-Session.");
      }
    } catch (error) {
      console.error("Purchase/Request failed:", error);
      alert("Prozess fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!existingContract?.id) return;
    if (!confirm("Möchtest du diese Anfrage wirklich zurückziehen?")) return;

    setLoading(true);
    try {
      await withdrawReactionContract(existingContract.id);
      setExistingContract(null); // Clear pending state
    } catch (error) {
      console.error("Withdraw failed", error);
      alert("Fehler beim Zurückziehen der Anfrage.");
    } finally {
      setLoading(false);
    }
  };

  // Determine Button State & Text
  const isPaid =
    existingContract?.status === "PAID" ||
    existingContract?.status === "ACTIVE";
  const isPending =
    existingContract?.status === "PENDING" &&
    !existingContract?.accepted_by_licensor;
  const isRejected = existingContract?.status === "REJECTED";

  return (
    <div className="video-details-right flex flex-col w-full gap-6">
      <FieldSet className="w-full max-w-xs">
        <FieldLegend variant="label">Select your Reaction Video</FieldLegend>
        {isLoadingVideos ? (
          <FieldDescription>Loading videos...</FieldDescription>
        ) : myVideos.length > 0 ? (
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedReactionVideoId}
            onChange={(e) => setSelectedReactionVideoId(e.target.value)}
            disabled={!!existingContract} // Lock selection if contract exists
          >
            <option value="" disabled>
              Select a video...
            </option>
            {myVideos.map((video) => (
              <option key={video.id} value={video.id}>
                {video.title}
              </option>
            ))}
          </select>
        ) : (
          <FieldDescription className="text-destructive">
            You have no uploaded videos to link.
          </FieldDescription>
        )}
      </FieldSet>

      {!isPaid && !isPending && !isRejected && (
        <FieldSet className="w-full max-w-xs">
          <FieldLegend variant="label">Subscription Plan</FieldLegend>
          <FieldDescription>
            Yearly and lifetime plans offer significant savings.
          </FieldDescription>
          <RadioGroup
            value={selectedPlan}
            onValueChange={(val: "monthly" | "yearly" | "lifetime") =>
              setSelectedPlan(val)
            }
          >
            <Field orientation="horizontal">
              <RadioGroupItem value="monthly" id="plan-monthly" />
              <FieldLabel htmlFor="plan-monthly" className="font-normal">
                Einmalzahlung {prices.oneTime.toFixed(2)} €
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="yearly" id="plan-yearly" />
              <FieldLabel htmlFor="plan-yearly" className="font-normal">
                PayPer 1000 Views {prices.payPerViews.toFixed(2)} €
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="lifetime" id="plan-lifetime" />
              <FieldLabel htmlFor="plan-lifetime" className="font-normal">
                PayPer CPM {prices.payPerCpm.toFixed(2)} €
              </FieldLabel>
            </Field>
          </RadioGroup>
        </FieldSet>
      )}

      {/* Main Action Area */}
      <div className="mt-4">
        {checkingLicense ? (
          <Button disabled className="w-full">
            Checking Status...
          </Button>
        ) : isPaid ? (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-md border border-green-500/20">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Lizenz bereits erworben</span>
          </div>
        ) : isPending ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 text-yellow-600 rounded-md border border-yellow-500/20">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">
                Anfrage gesendet. Warte auf Bestätigung.
              </span>
            </div>
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
              onClick={handleWithdraw}
              disabled={loading}
            >
              {loading ? "Wird zurückgezogen..." : "Anfrage zurückziehen"}
            </Button>
          </div>
        ) : existingContract?.status === "PENDING" &&
          existingContract?.accepted_by_licensor ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-md border border-green-500/20">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">
                Anfrage akzeptiert! Bitte bezahlen.
              </span>
            </div>
            <Button
              onClick={async () => {
                setLoading(true);
                try {
                  const { url } =
                    await import("@/services/stripeFunctions").then((mod) =>
                      mod.createStripeCheckoutSession(existingContract.id),
                    );
                  if (url) window.location.href = url;
                } catch (e) {
                  console.error(e);
                  alert("Fehler beim Starten der Zahlung");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Lade..." : "Jetzt bezahlen"}
            </Button>
          </div>
        ) : isRejected ? (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
            <XCircle className="h-5 w-5" />
            <div>
              <span className="font-bold block">Anfrage abgelehnt</span>
              <span className="text-xs opacity-90">
                Für dieses Video ist keine weitere Anfrage möglich.
              </span>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleBuy}
            disabled={
              loading ||
              isLoadingVideos ||
              !selectedReactionVideoId ||
              checkingLicense
            }
            className="w-full"
          >
            {loading ? "Verarbeite..." : "Kaufen / Anfrage senden"}
          </Button>
        )}
      </div>
    </div>
  );
};
