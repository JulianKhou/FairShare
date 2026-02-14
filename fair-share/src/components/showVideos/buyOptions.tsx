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
} from "@/services/supabaseCollum/reactionContract";
import { useState, useEffect } from "react";
import { generateUUID } from "@/lib/utils";
import { useVideos } from "@/hooks/youtube/useVideos";

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
  const [existingLicenseStatus, setExistingLicenseStatus] = useState<string | null>(null);
  const [checkingLicense, setCheckingLicense] = useState(false);

  // Fetch user's videos for selection
  const { videos: myVideos, isLoading: isLoadingVideos } = useVideos("myVideos", user?.id);
  const [selectedReactionVideoId, setSelectedReactionVideoId] = useState<string>("");

  // Auto-select removed to enforce manual selection

  // Check for existing license
  useEffect(() => {
    const checkLicense = async () => {
      if (user?.id && videoCreator?.id && selectedReactionVideoId) {
        setCheckingLicense(true);
        const status = await checkExistingLicense(
          user.id,
          videoCreator.id,
          selectedReactionVideoId
        );
        setExistingLicenseStatus(String(status || '')); // Ensure string or empty
        setCheckingLicense(false);
      }
    };

    checkLicense();
  }, [user, videoCreator, selectedReactionVideoId]);

  // Determine which video is selected
  const selectedVideo = myVideos.find(v => v.id === selectedReactionVideoId) || videoReactor;
  
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
        id: generateUUID(), // Generate client-side ID (supports http/ip)
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
        accepted_by_licensor: false,
        accepted_by_licensee: true,
        contract_version: "1.0",
        status: "PENDING", // Initial status
        reaction_video_id: selectedReactionVideoId,
      };

      // 1. Create Contract in DB
      const customContract = await createReactionContract(newContract);
      const contractId = customContract?.id || newContract.id;

      // 2. Create Stripe Checkout Session
      const { url } = await import("@/services/stripeFunctions").then((mod) =>
        mod.createStripeCheckoutSession(contractId),
      );

      // 3. Redirect to Stripe
      if (url) {
        window.location.href = url;
      } else {
        alert("Fehler beim Erstellen der Checkout-Session.");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Purchase failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            >
                <option value="" disabled>Select a video...</option>
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
      <Button 
        onClick={handleBuy} 
        disabled={loading || isLoadingVideos || !selectedReactionVideoId || !!existingLicenseStatus || checkingLicense} 
        className="mt-4"
      >
        {checkingLicense ? "Checking..." : existingLicenseStatus === "PAID" ? "License already owned" : existingLicenseStatus === "PENDING" ? "Purchase Pending" : loading ? "Processing..." : "Buy"}
      </Button>
      {existingLicenseStatus === "PAID" && (
        <p className="text-xs text-destructive mt-1">
          You have already purchased a license for this video combination.
        </p>
      )}
      {existingLicenseStatus === "PENDING" && (
        <p className="text-xs text-warning mt-1">
          A purchase is technically pending. Please check your contracts or contact support if this persists.
        </p>
      )}
    </div>
  );
};
