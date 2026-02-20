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
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";

interface OnboardingModalProps {
  userProfile: Profile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  userId: string;
}

export function OnboardingModal({
  userProfile,
  isOpen,
  onOpenChange,
  onComplete,
  userId,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  // Form State Step 1 (Profile)
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || "",
    address_street: userProfile?.address_street || "",
    address_number: userProfile?.address_number || "",
    address_zip: userProfile?.address_zip || "",
    address_city: userProfile?.address_city || "",
  });

  // Form State Step 2 (Automation)
  const [automationData, setAutomationData] = useState<{
    auto_accept_reactions: boolean;
    auto_license_videos: boolean;
  }>({
    auto_accept_reactions: userProfile?.auto_accept_reactions ?? true,
    auto_license_videos: userProfile?.auto_license_videos ?? true,
  });

  // Reset steps if re-opened
  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  const handleNextStep = () => {
    setStep(2);
  };

  const handleSkipProfile = () => {
    setStep(2);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const updates = {
        ...formData,
        ...automationData,
      };

      await updateProfile(userId, updates);

      toast.success(
        "Willkommen bei FairShare! Profil erfolgreich eingerichtet.",
      );
      onComplete(); // trigger parent update / close
      onOpenChange(false);
      localStorage.setItem(`fairshare_onboarding_done_${userId}`, "true");
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      toast.error("Fehler beim Speichern der Daten.");
    } finally {
      setSaving(false);
    }
  };

  // Check if profile fields (Step 1) are reasonably filled
  const isProfileStepValid =
    formData.full_name && formData.address_street && formData.address_city;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* We prevent clicking outside or pressing Escape to close the modal during onboarding. 
          But since we allow skipping, let's keep it closeable, just in case. */}
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">
            <DialogHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl">
                Willkommen bei FairShare
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                Bevor wir loslegen, benötigen wir noch eine kurze
                Rechnungsadresse für künftige Lizenzverträge.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Vollständiger Name
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
                onClick={handleSkipProfile}
                className="text-muted-foreground"
              >
                Später ausfüllen <SkipForward className="ml-2 w-4 h-4" />
              </Button>
              <Button onClick={handleNextStep} disabled={!isProfileStepValid}>
                Weiter <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 pt-4">
            <DialogHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Settings2 className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl">
                Automatisierung
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                Mach es dir einfach. Du kannst FairShare so einstellen, dass
                alles automatisch im Hintergrund abläuft.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex items-start space-x-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-base">
                    Videos automatisch lizenzieren
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Neue public YouTube-Videos rufen wir automatisch für dich ab
                    und geben sie zur Lizenzierung auf FairShare frei.
                  </p>
                </div>
                <Switch
                  checked={automationData.auto_license_videos}
                  onCheckedChange={(c) =>
                    setAutomationData((prev) => ({
                      ...prev,
                      auto_license_videos: c,
                    }))
                  }
                />
              </div>

              <div className="flex items-start space-x-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-base">
                    Anfragen automatisch annehmen
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Wenn jemand für deine Videos eine Lizenz kauft, wird der
                    Vertrag sofort geschlossen und das Geld gutgeschrieben, ohne
                    dass du es manuell bestätigen musst.
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

              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-3 rounded-md">
                <p className="text-xs text-yellow-800 dark:text-yellow-500 text-center flex items-center justify-center gap-2">
                  <span className="text-lg">💡</span>
                  Keine Sorge: Du kannst diese Einstellungen später jederzeit in
                  deinen Profil-Einstellungen ändern.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center w-full">
              <Button variant="outline" onClick={() => setStep(1)}>
                Zurück
              </Button>
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Fertigstellen
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
