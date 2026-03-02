import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Profile, updateProfile } from "@/services/supabaseCollum/profiles";
import {
  Loader2,
  ArrowRight,
  UserCircle,
  Settings2,
  Video,
  ShoppingBag,
  CreditCard,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { createStripeConnectAccount } from "@/services/stripeFunctions";

interface OnboardingModalProps {
  userProfile: Profile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  userId: string;
}

type OnboardingStep = "role" | "profile" | "automation" | "stripe-promo";

export function OnboardingModal({
  userProfile,
  isOpen,
  onOpenChange,
  onComplete,
  userId,
}: OnboardingModalProps) {
  const [step, setStep] = useState<OnboardingStep>("role");
  const [saving, setSaving] = useState(false);
  const [isCreator, setIsCreator] = useState<boolean | null>(null);
  const [wantsStripeNow, setWantsStripeNow] = useState(true);

  // Form State Step: Profile
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || "",
    address_street: userProfile?.address_street || "",
    address_number: userProfile?.address_number || "",
    address_zip: userProfile?.address_zip || "",
    address_city: userProfile?.address_city || "",
  });

  // Form State Step: Automation
  const [automationData, setAutomationData] = useState<{
    auto_accept_reactions: boolean;
    auto_license_videos: "none" | "public_only" | "all";
  }>({
    auto_accept_reactions: userProfile?.auto_accept_reactions ?? true,
    auto_license_videos: userProfile?.auto_license_videos ?? "public_only",
  });

  // Reset steps if re-opened
  useEffect(() => {
    if (isOpen) {
      setStep("role");
      setIsCreator(null);
    }
  }, [isOpen]);

  const handleNextStep = () => {
    if (step === "role") {
      setStep("profile");
    } else if (step === "profile") {
      if (isCreator) {
        setStep("automation");
      } else {
        handleFinish();
      }
    } else if (step === "automation") {
      setStep("stripe-promo");
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const updates = {
        ...formData,
        ...(isCreator ? automationData : {}),
      };

      await updateProfile(userId, updates);

      localStorage.setItem(`simpleshare_onboarding_done_${userId}`, "true");
      onComplete(); // trigger parent update / close

      if (step === "stripe-promo" && wantsStripeNow) {
        toast.success("Profil gespeichert! Leite zu Stripe weiter...");
        const { url } = await createStripeConnectAccount();
        if (url) {
          window.location.href = url;
          return;
        }
      }

      toast.success(
        "Willkommen bei SimpleShare! Profil erfolgreich eingerichtet.",
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      toast.error("Fehler beim Speichern der Daten.");
    } finally {
      setSaving(false);
    }
  };

  const isProfileStepValid =
    formData.full_name && formData.address_street && formData.address_city;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* STEP 0: Role Selection */}
        {step === "role" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">
                Wie möchtest du SimpleShare nutzen?
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                Wähle deinen primären Fokus, um dein Erlebnis zu
                personalisieren.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 py-4">
              <button
                onClick={() => setIsCreator(true)}
                className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all text-left ${
                  isCreator === true
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-lg">Ich bin Creator</p>
                  <p className="text-sm text-muted-foreground">
                    Ich möchte meine Videos zur Lizenzierung freigeben und Geld
                    verdienen.
                  </p>
                </div>
                {isCreator === true && (
                  <Check className="ml-auto text-primary" />
                )}
              </button>

              <button
                onClick={() => setIsCreator(false)}
                className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all text-left ${
                  isCreator === false
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-lg">Ich bin Käufer</p>
                  <p className="text-sm text-muted-foreground">
                    Ich möchte Lizenzen für Videos erwerben und rechtssicher
                    nutzen.
                  </p>
                </div>
                {isCreator === false && (
                  <Check className="ml-auto text-primary" />
                )}
              </button>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleNextStep}
                className="w-full"
                disabled={isCreator === null}
              >
                Loslegen <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1: Profile Info */}
        {step === "profile" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 pt-4">
            <DialogHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl">
                Rechnungsadresse
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                Damit deine Verträge rechtssicher sind, benötigen wir deine
                Adresse.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Vollständiger Name / Firma
                </label>
                <Input
                  placeholder="Max Mustermann"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2 col-span-3">
                  <label className="text-sm font-medium">Straße</label>
                  <Input
                    placeholder="Hauptstraße"
                    value={formData.address_street}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address_street: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <label className="text-sm font-medium">Nr.</label>
                  <Input
                    placeholder="123"
                    value={formData.address_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address_number: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1">
                  <label className="text-sm font-medium">PLZ</label>
                  <Input
                    placeholder="10115"
                    value={formData.address_zip}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address_zip: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Stadt</label>
                  <Input
                    placeholder="Berlin"
                    value={formData.address_city}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address_city: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center w-full">
              <Button
                variant="ghost"
                onClick={() => setStep("role")}
                className="text-muted-foreground"
              >
                Zurück
              </Button>
              <Button onClick={handleNextStep} disabled={!isProfileStepValid}>
                {isCreator
                  ? "Weiter"
                  : saving
                    ? "Speichern..."
                    : "Fertigstellen"}
                {saving ? (
                  <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="ml-2 w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Automation (Only for Creators) */}
        {step === "automation" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 pt-4">
            <DialogHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Settings2 className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl">
                Automatisierung
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                Lehne dich zurück. SimpleShare kann alles im Hintergrund für
                dich regeln.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <p className="font-medium text-sm px-1">
                  Videos automatisch lizenzieren
                </p>
                <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
                  {[
                    { value: "none" as const, label: "Manuell" },
                    { value: "public_only" as const, label: "Nur Öffentliche" },
                    { value: "all" as const, label: "Alle Videos" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setAutomationData((prev) => ({
                          ...prev,
                          auto_license_videos: option.value,
                        }))
                      }
                      className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                        automationData.auto_license_videos === option.value
                          ? "bg-background shadow text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 border rounded-xl bg-muted/20">
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Anfragen automatisch annehmen</p>
                  <p className="text-xs text-muted-foreground">
                    Verkäufe werden sofort finalisiert und gutgeschrieben.
                  </p>
                </div>
                <Switch
                  checked={automationData.auto_accept_reactions}
                  onCheckedChange={(c) =>
                    setAutomationData((prev) => ({
                      ...prev,
                      auto_accept_reactions: c,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-between items-center w-full">
              <Button variant="outline" onClick={() => setStep("profile")}>
                Zurück
              </Button>
              <Button onClick={handleNextStep}>
                Weiter <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Stripe Payout Promo (Only for Creators) */}
        {step === "stripe-promo" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 pt-4">
            <DialogHeader>
              <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <DialogTitle className="text-center text-2xl">
                Auszahlungen einrichten
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                Damit wir dir Einnahmen überweisen können, muss dein Konto mit
                Stripe verknüpft sein.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div
                onClick={() => setWantsStripeNow(true)}
                className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  wantsStripeNow
                    ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                    : "border-border"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${wantsStripeNow ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground"}`}
                >
                  {wantsStripeNow && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="font-bold">Jetzt einrichten (Empfohlen)</p>
                  <p className="text-sm text-muted-foreground">
                    Wir leiten dich direkt zum sicheren Onboarding weiter.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setWantsStripeNow(false)}
                className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  !wantsStripeNow
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${!wantsStripeNow ? "border-primary bg-primary" : "border-muted-foreground"}`}
                >
                  {!wantsStripeNow && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="font-bold">Später in den Einstellungen</p>
                  <p className="text-sm text-muted-foreground">
                    Du kannst deine Verkäufe erst starten, wenn dies erledigt
                    ist.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center w-full">
              <Button variant="outline" onClick={() => setStep("automation")}>
                Zurück
              </Button>
              <Button
                onClick={handleFinish}
                disabled={saving}
                className={
                  wantsStripeNow
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : ""
                }
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {wantsStripeNow ? "Zu Stripe weiterleiten" : "Abschließen"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
