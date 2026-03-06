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
import { AlertCircle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { createStripeCheckoutSession } from "@/services/stripeFunctions";
import { useExistingLicense } from "@/hooks/queries/useExistingLicense";
import { useAnyExistingLicense } from "@/hooks/queries/useAnyExistingLicense";
import { useCreatorMinPrice } from "@/hooks/queries/useCreatorMinPrice";
import { useAlgorithmSettings } from "@/hooks/queries/useAlgorithmSettings";
import {
  buildAlgorithmInputSnapshot,
  buildAlgorithmVersion,
} from "@/services/algorithmAudit";
import {
  buildDefaultUsageSelection,
  validateUsageSelection,
} from "@/services/usagePolicy";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface BuyOptionsProps {
  videoCreator: any;
  videoReactor: any;
}

export const BuyOptions = ({ videoCreator, videoReactor }: BuyOptionsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<"fixed" | "views">("fixed");
  const [loading, setLoading] = useState(false);
  const [usageConsentAccepted, setUsageConsentAccepted] = useState(false);

  const { videos: myVideos, isLoading: isLoadingVideos } = useVideos(
    "myVideos",
    user?.id,
  );

  const isDirectLink = videoCreator?.id !== videoReactor?.id;
  const [selectedReactionVideoId, setSelectedReactionVideoId] =
    useState<string>(isDirectLink ? videoReactor?.id : "");

  const { data: existingContract, isLoading: checkingLicense } =
    useExistingLicense(user?.id, videoCreator?.id, selectedReactionVideoId);

  const { data: hasAnyLicense } = useAnyExistingLicense(
    user?.id,
    videoCreator?.id,
  );

  const { data: creatorMinPrice = 0 } = useCreatorMinPrice(
    videoCreator?.creator_id || videoCreator?.id,
  );
  const { data: algorithmSettings } = useAlgorithmSettings();

  const selectedVideo =
    myVideos.find((v) => v.id === selectedReactionVideoId) || videoReactor;

  const rawPrices = getPrices(selectedVideo, videoCreator, algorithmSettings);
  const prices = {
    ...rawPrices,
    oneTime: Math.max(rawPrices.oneTime, creatorMinPrice),
    payPerViews: rawPrices.payPerViews,
  };

  const isPaid =
    existingContract?.status === "PAID" ||
    existingContract?.status === "ACTIVE";
  const isPending =
    existingContract?.status === "PENDING" &&
    !existingContract?.accepted_by_licensor;
  const isRejected = existingContract?.status === "REJECTED";
  const isAwaitingPayment =
    existingContract?.status === "PENDING" &&
    existingContract?.accepted_by_licensor;

  const showPlanStep = !isPaid && !isPending && !isRejected;
  const requiresConsent = showPlanStep || isAwaitingPayment;

  const handleBuy = async () => {
    if (!user) {
      toast.error("Bitte logge dich ein, um eine Lizenz zu erwerben.");
      return;
    }

    if (!selectedReactionVideoId) {
      toast.error("Bitte waehle ein Video fuer die Lizenz aus.");
      return;
    }

    if (!usageConsentAccepted) {
      toast.error("Bitte bestaetige zuerst die Zustimmung zur Nutzung dieses Videos.");
      return;
    }

    setLoading(true);
    try {
      const creatorProfile = await getProfile(
        videoCreator.creator_id || videoCreator.id,
      );
      const autoAccept = creatorProfile?.auto_accept_reactions ?? false;

      let modelType: 1 | 2 = 1;
      let price = prices.oneTime;

      if (selectedPlan === "views") {
        modelType = 2;
        price = prices.payPerViews;
      } else {
        modelType = 1;
        price = prices.oneTime;
      }

      const usageSelection = buildDefaultUsageSelection(
        modelType,
        algorithmSettings?.usagePolicyConfig,
      );
      const usageValidationErrors = validateUsageSelection(
        usageSelection,
        modelType,
        algorithmSettings?.usagePolicyConfig,
      );

      if (usageValidationErrors.length > 0) {
        throw new Error(usageValidationErrors[0]);
      }

      const algorithmVersion = buildAlgorithmVersion(algorithmSettings);
      const algorithmInputSnapshot = buildAlgorithmInputSnapshot({
        videoCreator,
        videoReactor: selectedVideo,
        selectedReactionVideoId,
        selectedPlan,
        pricingModelType: modelType,
        selectedPrice: price,
        creatorMinPrice,
        rawPrices,
        prices,
        usageSelection,
        algorithmSettings,
      });

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
        fairshare_score: rawPrices.fairshareScore,
        fairshare_metadata: {
          marktmacht_score: rawPrices.marktmachtScore,
          schoepferische_leistung: rawPrices.schoepferischeLeistungScore,
          parameter_dokumentation_url: "https://simpleshare.eu/how-it-works",
        },
        algorithm_version: algorithmVersion,
        algorithm_input_snapshot: algorithmInputSnapshot,
        accepted_by_licensor: autoAccept,
        accepted_by_licensee: usageConsentAccepted,
        licensee_accepted_at: usageConsentAccepted
          ? new Date().toISOString()
          : undefined,
        contract_version: "1.0",
        status: "PENDING",
        reaction_video_id: selectedReactionVideoId,
      };

      const customContract = await createReactionContract(newContract);
      const contractId = customContract?.id || newContract.id;

      if (!autoAccept) {
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

      const { url } = await createStripeCheckoutSession(contractId);

      if (url) {
        window.location.href = url;
      } else {
        toast.error("Fehler beim Erstellen der Checkout-Session.");
      }
    } catch (error) {
      console.error("Purchase/Request failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Prozess fehlgeschlagen. Bitte erneut versuchen.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!existingContract?.id) return;
    if (!confirm("Moechtest du diese Anfrage wirklich zurueckziehen?")) return;

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
      });
    } catch (error) {
      console.error("Withdraw failed", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Zurueckziehen der Anfrage.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-details-right flex flex-col w-full gap-3">
      {!hasAnyLicense && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Ablauf
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-md border border-border/50 bg-background/80 px-2.5 py-2">
              1) Reaktionsvideo waehlen
            </div>
            <div className="rounded-md border border-border/50 bg-background/80 px-2.5 py-2">
              2) Modell & Preis bestaetigen
            </div>
            <div className="rounded-md border border-border/50 bg-background/80 px-2.5 py-2">
              3) Zustimmung & Checkout
            </div>
          </div>
        </div>
      )}

      {hasAnyLicense && (
        <div className="flex items-start gap-2 p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg border border-green-500/20 shadow-sm">
          <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold">Lizenz bereits vorhanden</span>
            <span className="text-sm mt-1 opacity-90">
              Du hast fuer dieses Grundvideo bereits eine aktive Lizenz.
            </span>
          </div>
        </div>
      )}

      {!isDirectLink && (
        <FieldSet className="w-full space-y-1">
          <FieldLegend variant="label">Schritt 1: Mein Reaktionsvideo</FieldLegend>
          {isLoadingVideos ? (
            <FieldDescription>Videos werden geladen...</FieldDescription>
          ) : myVideos.length > 0 ? (
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedReactionVideoId}
              onChange={(e) => setSelectedReactionVideoId(e.target.value)}
            >
              <option value="" disabled>
                Video auswaehlen...
              </option>
              {myVideos.map((video) => (
                <option key={video.id} value={video.id}>
                  {video.title}
                </option>
              ))}
            </select>
          ) : (
            <FieldDescription className="text-destructive">
              Keine eigenen Videos gefunden.
            </FieldDescription>
          )}
        </FieldSet>
      )}

      {showPlanStep && (
        <FieldSet className="w-full space-y-2">
          <FieldLegend variant="label">Schritt 2: Preismodell</FieldLegend>
          <RadioGroup
            value={selectedPlan}
            onValueChange={(val: "fixed" | "views") => setSelectedPlan(val)}
          >
            <Field orientation="horizontal">
              <RadioGroupItem value="fixed" id="plan-fixed" />
              <FieldLabel htmlFor="plan-fixed" className="font-normal">
                Einmalzahlung {prices.oneTime.toFixed(2)} EUR
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="views" id="plan-views" />
              <FieldLabel
                htmlFor="plan-views"
                className="font-normal flex items-center gap-1"
              >
                CPM {prices.payPerViews.toFixed(2)} EUR
                <span className="group relative inline-flex">
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Abrechnung pro 1.000 Aufrufe, regelmaessig synchronisiert.
                  </span>
                </span>
              </FieldLabel>
            </Field>
          </RadioGroup>
        </FieldSet>
      )}

      {!hasAnyLicense && (
        <div className="mt-1 space-y-3">
          {requiresConsent && (
            <div className="p-3 rounded-md border border-border/60 bg-muted/20">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Schritt 3: Zustimmung
              </p>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-input"
                  checked={usageConsentAccepted}
                  onChange={(e) => setUsageConsentAccepted(e.target.checked)}
                />
                <span>
                  Ich stimme der Nutzung meines Reaktionsvideos im Rahmen dieses
                  Lizenzvertrags zu.
                </span>
              </label>
            </div>
          )}

          {checkingLicense ? (
            <Button disabled className="w-full">
              Status wird geprueft...
            </Button>
          ) : isPaid ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-md border border-green-500/20">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Lizenz bereits erworben</span>
            </div>
          ) : isPending ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 text-yellow-700 rounded-md border border-yellow-500/20">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  Anfrage gesendet. Warte auf Bestaetigung.
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                onClick={handleWithdraw}
                disabled={loading}
              >
                {loading ? "Wird zurueckgezogen..." : "Anfrage zurueckziehen"}
              </Button>
            </div>
          ) : isAwaitingPayment ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-md border border-green-500/20">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  Anfrage akzeptiert. Bitte Zahlung abschliessen.
                </span>
              </div>
              <Button
                onClick={async () => {
                  if (!usageConsentAccepted) {
                    toast.error("Bitte bestaetige zuerst die Zustimmung zur Nutzung dieses Videos.");
                    return;
                  }
                  setLoading(true);
                  try {
                    const { url } = await createStripeCheckoutSession(
                      existingContract.id,
                    );
                    if (url) window.location.href = url;
                  } catch (e) {
                    console.error(e);
                    toast.error(
                      e instanceof Error
                        ? e.message
                        : "Fehler beim Starten der Zahlung",
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !usageConsentAccepted}
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
                  Fuer dieses Video ist keine weitere Anfrage moeglich.
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
                checkingLicense ||
                !usageConsentAccepted
              }
              className="w-full"
            >
              {loading ? "Verarbeite..." : "Kaufen / Anfrage senden"}
            </Button>
          )}

          {showPlanStep && (
            <p className="text-xs text-muted-foreground">
              Mit Klick auf den Kaufbutton wird der Lizenzvertrag erstellt. Details
              findest du in den AGB.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
