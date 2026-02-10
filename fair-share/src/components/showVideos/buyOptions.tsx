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
import { prepareContractData } from "@/utils/prepareContract";
import { getPrices } from "@/hooks/videoDetails/getPrices";
import { createReactionContract } from "@/services/supabaseCollum/reactionContract";
import { useState, useEffect } from "react";
import { getProfile, isProfileComplete, Profile } from "@/services/supabaseCollum/profiles";
import { generateLicensePDF } from "@/services/supabaseFunctions";
import { useAuth } from "@/hooks/auth/useAuth";



interface BuyOptionsProps {
  videoCreator: any;
  videoReactor: any;
}

export const BuyOptions = ({ videoCreator, videoReactor }: BuyOptionsProps) => {
  const prices = getPrices(videoReactor, videoCreator);
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [reactorProfile, setReactorProfile] = useState<Profile | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getProfile(user.id).then((profile) => {
        if (profile) setReactorProfile(profile);
      });
    }
  }, [user]);

  const handleBuy = async () => {
    if (!reactorProfile || !isProfileComplete(reactorProfile)) {
      alert("Please complete your profile details (Address, Name, Channel ID) before purchasing a license.");
      return;
    }

    const contractData = prepareContractData({
      videoCreator,
      videoReactor,
      selectedPlan,
      prices
    });
    console.log("Creating contract with data:", contractData);
    try {
      const createdContract = await createReactionContract(contractData);
      
      // If contract was auto-accepted, generate and send PDF
      if (createdContract?.accepted_by_licensor) {
        try {
          await generateLicensePDF(createdContract.id);
          alert("Contract created and emailed to both parties! ✅");
        } catch (pdfError) {
          console.error("Failed to generate PDF:", pdfError);
          alert("Contract created, but PDF generation failed. Please contact support.");
        }
      } else {
        alert("Contract request sent! Waiting for creator approval.");
      }
    } catch (e) {
      console.error("Failed to create contract:", e);
      alert("Failed to create contract. See console.");
    }
  };

  return (
    <div className="video-details-right flex flex-col w-full">
      <FieldSet className="w-full max-w-xs">
        <FieldLegend variant="label">Subscription Plan</FieldLegend>
        <FieldDescription>
          Yearly and lifetime plans offer significant savings.
        </FieldDescription>
        <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
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
      <Button onClick={handleBuy}>Buy</Button>
    </div>
  )
}