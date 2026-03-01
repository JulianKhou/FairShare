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
  withdrawReactionContract,
} from "@/services/supabaseCollum/reactionContract";
import { getProfile } from "@/services/supabaseCollum/profiles";
import { useState } from "react";
import { generateUUID } from "@/lib/utils";
import { useVideos } from "@/hooks/youtube/useVideos";
import { AlertCircle, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { createStripeCheckoutSession } from "@/services/stripeFunctions";
import { useExistingLicense } from "@/hooks/queries/useExistingLicense";
import { useAnyExistingLicense } from "@/hooks/queries/useAnyExistingLicense";
import { useCreatorMinPrice } from "@/hooks/queries/useCreatorMinPrice";
import { useQueryClient } from "@tanstack/react-query";

interface BuyOptionsProps {
  videoCreator: any;
  videoReactor: any;
}

export const BuyOptions = ({ videoCreator, videoReactor }: BuyOptionsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<"fixed" | "views">("fixed");
  const [loading, setLoading] = useState(false);

  // Fetch user's videos for selection
  const { videos: myVideos, isLoading: isLoadingVideos } = useVideos(
    "myVideos",
    user?.id,
  );
  const [selectedReactionVideoId, setSelectedReactionVideoId] =
    useState<string>("");

  const { data: existingContract, isLoading: checkingLicense } =
    useExistingLicense(user?.id, videoCreator?.id, selectedReactionVideoId);

  const { data: hasAnyLicense } = useAnyExistingLicense(
    user?.id,
    videoCreator?.id,
  );

  const { data: creatorMinPrice = 0 } = useCreatorMinPrice(
    videoCreator?.creator_id || videoCreator?.id,
  );

  // Determine which video is selected
  const selectedVideo =
    myVideos.find((v) => v.id === selectedReactionVideoId) || videoReactor;

  // Recalculate prices based on the selected video, applying creator min price
  const rawPrices = getPrices(selectedVideo, videoCreator);
  const prices = {
    ...rawPrices,
    oneTime: Math.max(rawPrices.oneTime, creatorMinPrice),
    payPerViews: rawPrices.payPerViews, // Views-based stays algorithm-driven
  };

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
      let modelType: 1 | 2 = 1;
      let price = prices.oneTime;

      if (selectedPlan === "views") {
        modelType = 2; // PayPerView / 1000 Views (metered billing)
        price = prices.payPerViews;
      } else {
        modelType = 1; // Fixed one-time payment
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
        // If NOT auto-accepted, invalidate query to show Pending UI
        queryClient.invalidateQueries({
          queryKey: [
            "existingLicense",
            user.id,
            videoCreator.id,
            selectedReactionVideoId,
          ],
        });
        return;
      }

      // 3. If Auto-Accepted, Proceed to Stripe
      const { url } = await createStripeCheckoutSession(contractId);

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
      queryClient.invalidateQueries({
        queryKey: [
          "existingLicense",
          user?.id,
          videoCreator?.id,
          selectedReactionVideoId,
        ],
      }); // Clear pending state
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
    <div className="video-details-right flex flex-col w-full gap-3">
      {hasAnyLicense && (
        <div className="flex items-start gap-2 p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg border border-green-500/20 shadow-sm">
          <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold">Lizenz bereits vorhanden</span>
            <span className="text-sm mt-1 opacity-90">
              Du hast für dieses Video bereits eine aktive Lizenz erworben. Pro
              Grundvideo ist nur eine Lizenz möglich.
            </span>
          </div>
        </div>
      )}

      <FieldSet className="w-full max-w-xs space-y-1">
        <FieldLegend variant="label">Select your Reaction Video</FieldLegend>
        {isLoadingVideos ? (
          <FieldDescription>Loading videos...</FieldDescription>
        ) : myVideos.length > 0 ? (
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedReactionVideoId}
            onChange={(e) => setSelectedReactionVideoId(e.target.value)}
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
        <FieldSet className="w-full max-w-xs space-y-2">
          <FieldLegend variant="label">Preismodell</FieldLegend>
          <RadioGroup
            value={selectedPlan}
            onValueChange={(val: "fixed" | "views") => setSelectedPlan(val)}
          >
            <Field orientation="horizontal">
              <RadioGroupItem value="fixed" id="plan-fixed" />
              <FieldLabel htmlFor="plan-fixed" className="font-normal">
                Einmalzahlung {prices.oneTime.toFixed(2)} €
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="views" id="plan-views" />
              <FieldLabel
                htmlFor="plan-views"
                className="font-normal flex items-center gap-1"
              >
                CPM {prices.payPerViews.toFixed(2)} €
                <div className="group relative">
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    CPM steht für Cost-per-Mille und bedeutet "Kosten pro 1.000
                    Aufrufe". Dieser Betrag wird vierteljährlich basierend auf
                    den Views deines Reaction-Videos abgerechnet.
                  </div>
                </div>
              </FieldLabel>
            </Field>
          </RadioGroup>
          {selectedPlan === "views" && (
            <p className="text-xs text-muted-foreground italic mt-1">
              💡 Views werden täglich automatisch erfasst und quartalsweise
              abgerechnet.
            </p>
          )}
        </FieldSet>
      )}

      {/* Main Action Area — hidden if already licensed for this base video */}
      {!hasAnyLicense && (
        <div className="mt-2">
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
                    const { url } = await createStripeCheckoutSession(
                      existingContract.id,
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
      )}
    </div>
  );
};
