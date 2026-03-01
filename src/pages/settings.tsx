import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldDescription,
  FieldContent,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/auth/useAuth";
import { updateProfile, Profile } from "@/services/supabaseCollum/profiles";
import { Loader2, Save } from "lucide-react";
import { createStripeConnectAccount } from "@/services/stripeFunctions";
import { useProfile } from "@/hooks/queries/useProfile";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: initialProfile, isLoading: loading } = useProfile(user?.id);

  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  const handleChange = (field: keyof Profile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile(user.id, profile);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      setMessage({
        text: "Einstellungen erfolgreich gespeichert!",
        type: "success",
      });
    } catch (e) {
      console.error(e);
      setMessage({ text: "Fehler beim Speichern.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">Einstellungen</h1>
      <p className="text-muted-foreground mb-8">
        Verwalte dein Profil und deine Präferenzen.
      </p>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Personal Info */}
        <FieldSet>
          <FieldLegend>Persönliche Informationen</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={profile.full_name || ""}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Max Mustermann"
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        {/* Address */}
        <FieldSet>
          <FieldLegend>Adresse</FieldLegend>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field className="md:col-span-3">
              <FieldLabel>Straße</FieldLabel>
              <Input
                value={profile.address_street || ""}
                onChange={(e) => handleChange("address_street", e.target.value)}
                placeholder="Hauptstraße"
              />
            </Field>
            <Field>
              <FieldLabel>Nr.</FieldLabel>
              <Input
                value={profile.address_number || ""}
                onChange={(e) => handleChange("address_number", e.target.value)}
                placeholder="123"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Field>
              <FieldLabel>PLZ</FieldLabel>
              <Input
                value={profile.address_zip || ""}
                onChange={(e) => handleChange("address_zip", e.target.value)}
                placeholder="10115"
              />
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel>Stadt</FieldLabel>
              <Input
                value={profile.address_city || ""}
                onChange={(e) => handleChange("address_city", e.target.value)}
                placeholder="Berlin"
              />
            </Field>
          </div>
        </FieldSet>

        {/* Channel Info */}
        <FieldSet>
          <FieldLegend>Kanal Informationen</FieldLegend>
          <Field>
            <FieldLabel>YouTube Kanal ID / URL</FieldLabel>
            <Input
              value={profile.youtube_channel_id || ""}
              onChange={(e) =>
                handleChange("youtube_channel_id", e.target.value)
              }
              placeholder="UC..."
            />
          </Field>
        </FieldSet>

        {/* New: Auto-Accept Logic form Modal */}
        <FieldSet>
          <FieldLegend>Automatisierung</FieldLegend>
          <div className="flex flex-col gap-4">
            <Field
              orientation="horizontal"
              className="flex items-center justify-between p-4 border rounded-lg bg-card"
            >
              <FieldContent>
                <FieldLabel className="text-base">
                  Anfragen automatisch akzeptieren
                </FieldLabel>
                <FieldDescription>
                  Wenn aktiviert, werden eingehende Lizenzanfragen für deine
                  Videos sofort genehmigt.
                </FieldDescription>
              </FieldContent>
              <Switch
                checked={profile.auto_accept_reactions || false}
                onCheckedChange={(checked) =>
                  handleChange("auto_accept_reactions", checked)
                }
                className="ml-auto"
              />
            </Field>

            <div className="p-4 border rounded-lg bg-card space-y-3">
              <FieldContent>
                <FieldLabel className="text-base">
                  Videos automatisch lizenzieren
                </FieldLabel>
                <FieldDescription>
                  Neue von YouTube importierte Videos automatisch zur
                  Lizenzierung freigeben.
                </FieldDescription>
              </FieldContent>
              <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
                {(
                  [
                    { value: "none", label: "Nicht automatisch" },
                    { value: "public_only", label: "Nur öffentliche" },
                    { value: "all", label: "Alle Videos" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      handleChange("auto_license_videos", option.value);
                      // Set cutoff date when first activating
                      if (
                        option.value !== "none" &&
                        !profile.auto_license_since
                      ) {
                        handleChange(
                          "auto_license_since",
                          new Date().toISOString(),
                        );
                      }
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      (profile.auto_license_videos || "none") === option.value
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {profile.auto_license_videos &&
                profile.auto_license_videos !== "none" &&
                profile.auto_license_since && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Gilt für Videos ab dem{" "}
                    {new Date(profile.auto_license_since).toLocaleDateString(
                      "de-DE",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                    . Ältere Videos müssen manuell freigegeben werden.
                  </p>
                )}
            </div>
          </div>
        </FieldSet>

        {/* Lizenzpreise */}
        <FieldSet>
          <FieldLegend>Lizenzpreise</FieldLegend>
          <div className="flex flex-col gap-4">
            <Field
              orientation="horizontal"
              className="flex items-center justify-between p-4 border rounded-lg bg-card"
            >
              <FieldContent>
                <FieldLabel className="text-base">
                  Automatische Preisberechnung
                </FieldLabel>
                <FieldDescription>
                  Der Preis wird automatisch durch den SimpleShare-Algorithmus
                  basierend auf Video-Metriken berechnet.
                </FieldDescription>
              </FieldContent>
              <Switch
                checked={profile.use_auto_pricing !== false}
                onCheckedChange={(checked) =>
                  handleChange("use_auto_pricing", checked)
                }
                className="ml-auto"
              />
            </Field>

            {profile.use_auto_pricing === false && (
              <Field className="max-w-xs">
                <FieldLabel>Mindestpreis (EUR)</FieldLabel>
                <FieldDescription>
                  Dein Mindestpreis für eine Lizenz. Wenn der Algorithmus einen
                  höheren Preis berechnet, wird dieser verwendet.
                </FieldDescription>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    min="0.50"
                    step="0.50"
                    value={profile.min_license_price ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "min_license_price",
                        e.target.value ? parseFloat(e.target.value) : null,
                      )
                    }
                    placeholder="z.B. 5.00"
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    €
                  </span>
                </div>
              </Field>
            )}
          </div>
        </FieldSet>

        {/* Stripe Connect */}
        <FieldSet>
          <FieldLegend>Auszahlungseinstellungen</FieldLegend>
          <div className="flex flex-col gap-4">
            <FieldDescription>
              Verbinde dein Stripe-Konto, um Auszahlungen für verkaufte Lizenzen
              zu erhalten.
            </FieldDescription>

            {profile.stripe_connect_id ? (
              <div className="flex flex-col gap-2">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="font-bold">Stripe verbunden</p>
                    <p className="text-sm opacity-80">
                      Account ID: {profile.stripe_connect_id}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      setSaving(true);
                      const { url } = await createStripeConnectAccount();
                      if (url) window.location.href = url;
                    } catch (err) {
                      console.error(err);
                      setMessage({
                        text: "Fehler beim Öffnen des Stripe Dashboards.",
                        type: "error",
                      });
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                >
                  Setup abschließen / Dashboard öffnen
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={async () => {
                  try {
                    setSaving(true);
                    const { url } = await createStripeConnectAccount();
                    if (url) window.location.href = url;
                  } catch (err) {
                    console.error(err);
                    setMessage({
                      text: "Fehler beim Starten des Stripe-Onboardings.",
                      type: "error",
                    });
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                Mit Stripe verbinden
              </Button>
            )}
          </div>
        </FieldSet>

        <div className="flex justify-end pt-8 pb-20 sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t border-border mt-8">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Änderungen speichern
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
