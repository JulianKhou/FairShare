import {
  Field,
  FieldContent,
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
} from "@/services/supabaseCollum/reactionContract";
import { useState } from "react";

interface BuyOptionsProps {
  videoCreator: any;
  videoReactor: any;
}

export const BuyOptions = ({ videoCreator, videoReactor }: BuyOptionsProps) => {
  const prices = getPrices(videoReactor, videoCreator);
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<
    "monthly" | "yearly" | "lifetime"
  >("monthly");
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!user) {
      alert("Please log in to purchase a license.");
      return;
    }

    setLoading(true);
    try {
      // Map selection to model type and price
      let modelType: 1 | 2 | 3 = 1; // Default Fixed
      let price = prices.oneTime;

      if (selectedPlan === "yearly") {
        modelType = 2; // Views
        price = prices.payPerViews;
      } else if (selectedPlan === "lifetime") {
        modelType = 3; // CPM
        price = prices.payPerCpm;
      }

      const newContract: ReactionContract = {
        id: crypto.randomUUID(), // Generate client-side ID
        created_at: new Date().toISOString(),
        licensor_id: videoCreator.creator_id || videoCreator.id, // Fallback if creator_id missing? usually string
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
      };

      const customContract = await createReactionContract(newContract);
      const contractId = customContract?.id || newContract.id;

      // Call Webhook
      // Using existing webhook URL
      const webhookUrl = `https://n8n.srv1356974.hstgr.cloud/webhook/generate-license-pdf?id=${contractId}`;
      await fetch(webhookUrl, { method: "GET" });

      alert("License purchased successfully! PDF is being generated.");
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Purchase failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-details-right flex flex-col w-full">
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
      <Button onClick={handleBuy} disabled={loading} className="mt-4">
        {loading ? "Processing..." : "Buy"}
      </Button>
    </div>
  );
};
