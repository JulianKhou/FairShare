import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  useAlgorithmSettings,
  useUpdateAlgorithmSettings,
} from "@/hooks/queries/useAlgorithmSettings";
import {
  DEFAULT_PRICING_CONFIG,
  DEFAULT_USAGE_POLICY_CONFIG,
  type NicheRpmOverrides,
  type PricingConfig,
  type UsagePolicyConfig,
} from "@/types/algorithmSettings";
import {
  DEFAULT_SIMPLE_SHARE_CONFIG,
  type SimpleShareConfig,
} from "@/services/simpleShareAlgo";
import { NICHE_DATA } from "@/data/NicheData";

const toNumber = (value: string, fallback: number) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value: string): string[] => {
  const entries = value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  return [...new Set(entries)];
};

const toListInput = (values: string[]) => values.join(", ");

export default function AdminSettings() {
  const { data, isLoading, error } = useAlgorithmSettings();
  const updateMutation = useUpdateAlgorithmSettings();

  const [simpleShareConfig, setSimpleShareConfig] =
    useState<SimpleShareConfig>(DEFAULT_SIMPLE_SHARE_CONFIG);
  const [pricingConfig, setPricingConfig] =
    useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [nicheRpmOverrides, setNicheRpmOverrides] =
    useState<NicheRpmOverrides>({});
  const [usagePolicyConfig, setUsagePolicyConfig] =
    useState<UsagePolicyConfig>(DEFAULT_USAGE_POLICY_CONFIG);

  const nicheRows = useMemo(() => {
    return [...NICHE_DATA].sort((a, b) => a.name_de.localeCompare(b.name_de));
  }, []);

  useEffect(() => {
    if (!data) return;
    setSimpleShareConfig(data.simpleShareConfig);
    setPricingConfig(data.pricingConfig);
    setNicheRpmOverrides(data.nicheRpmOverrides);
    setUsagePolicyConfig(data.usagePolicyConfig);
  }, [data]);

  const handleSimpleShareChange = (
    key: keyof SimpleShareConfig,
    value: string,
  ) => {
    setSimpleShareConfig((prev) => ({
      ...prev,
      [key]: toNumber(value, prev[key]),
    }));
  };

  const handlePricingChange = (key: keyof PricingConfig, value: string) => {
    setPricingConfig((prev) => ({
      ...prev,
      [key]: toNumber(value, prev[key]),
    }));
  };

  const handleNicheRpmChange = (nicheId: string, value: string, fallback: number) => {
    setNicheRpmOverrides((prev) => ({
      ...prev,
      [nicheId]: Math.max(0, toNumber(value, fallback)),
    }));
  };

  const handleUsagePolicyListChange = (
    key:
      | "allowed_platform_scopes"
      | "allowed_usage_modes"
      | "allowed_license_durations",
    value: string,
    fallback: string[],
  ) => {
    const nextList = toList(value);
    setUsagePolicyConfig((prev) => ({
      ...prev,
      [key]: nextList.length > 0 ? nextList : fallback,
    }));
  };

  const handleUsagePolicyNumberChange = (
    key: "max_subscription_billing_months",
    value: string,
  ) => {
    setUsagePolicyConfig((prev) => ({
      ...prev,
      [key]: Math.max(1, Math.round(toNumber(value, prev[key]))),
    }));
  };

  const handleUsagePolicyBooleanChange = (key: "allow_exclusive", value: boolean) => {
    setUsagePolicyConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setSimpleShareConfig(DEFAULT_SIMPLE_SHARE_CONFIG);
    setPricingConfig(DEFAULT_PRICING_CONFIG);
    setNicheRpmOverrides({});
    setUsagePolicyConfig(DEFAULT_USAGE_POLICY_CONFIG);
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        simpleShareConfig,
        pricingConfig,
        nicheRpmOverrides,
        usagePolicyConfig,
      },
      {
        onSuccess: () => {
          toast.success("Algorithmus-Settings gespeichert.");
        },
        onError: (mutationError) => {
          console.error("Failed to update algorithm settings", mutationError);
          toast.error("Speichern fehlgeschlagen.");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Algorithmus Einstellungen</h1>
        <p className="text-muted-foreground mt-1">
          Feintuning für FairShare-Score, Preislogik, Branchen-CPM und Nutzungs-Policy.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {error && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-800">
              Settings konnten nicht aus der DB geladen werden. Es werden Default-Werte angezeigt.
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                SimpleShare Kernparameter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldSet className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldContent>
                    <FieldLabel>BASE_SHARE</FieldLabel>
                    <FieldDescription>Basisanteil für den Content-Score.</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="0.01"
                    value={simpleShareConfig.BASE_SHARE}
                    onChange={(e) =>
                      handleSimpleShareChange("BASE_SHARE", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>HYPE_FACTOR</FieldLabel>
                    <FieldDescription>Aufschlag für sehr neue Original-Videos.</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="0.01"
                    value={simpleShareConfig.HYPE_FACTOR}
                    onChange={(e) =>
                      handleSimpleShareChange("HYPE_FACTOR", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>HYPE_DECAY_DAYS</FieldLabel>
                    <FieldDescription>Tage bis der Hype-Aufschlag ausläuft.</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="1"
                    value={simpleShareConfig.HYPE_DECAY_DAYS}
                    onChange={(e) =>
                      handleSimpleShareChange("HYPE_DECAY_DAYS", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>EVERGREEN_DAYS</FieldLabel>
                    <FieldDescription>Ab diesem Alter greift der Evergreen-Faktor.</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="1"
                    value={simpleShareConfig.EVERGREEN_DAYS}
                    onChange={(e) =>
                      handleSimpleShareChange("EVERGREEN_DAYS", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>EVERGREEN_FACTOR</FieldLabel>
                    <FieldDescription>Multiplikator für ältere Original-Videos.</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="0.01"
                    value={simpleShareConfig.EVERGREEN_FACTOR}
                    onChange={(e) =>
                      handleSimpleShareChange("EVERGREEN_FACTOR", e.target.value)
                    }
                  />
                </Field>
              </FieldSet>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Leitplanken</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldSet className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldContent>
                    <FieldLabel>min_one_time_price</FieldLabel>
                    <FieldDescription>Absolute Untergrenze für Einmalzahlung.</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="0.1"
                    value={pricingConfig.min_one_time_price}
                    onChange={(e) =>
                      handlePricingChange("min_one_time_price", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>default_base_views</FieldLabel>
                    <FieldDescription>Fallback Views für Buyout-Berechnung.</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="100"
                    value={pricingConfig.default_base_views}
                    onChange={(e) =>
                      handlePricingChange("default_base_views", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>platform_fee_percent</FieldLabel>
                    <FieldDescription>Anteil der Plattform (0.10 = 10%).</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricingConfig.platform_fee_percent}
                    onChange={(e) =>
                      handlePricingChange("platform_fee_percent", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>assumed_percent_shown</FieldLabel>
                    <FieldDescription>Baseline für Anteil des gezeigten Originals.</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricingConfig.assumed_percent_shown}
                    onChange={(e) =>
                      handlePricingChange("assumed_percent_shown", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>min_percent_shown</FieldLabel>
                    <FieldDescription>Untere Grenze für den Nutzungsanteil.</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricingConfig.min_percent_shown}
                    onChange={(e) =>
                      handlePricingChange("min_percent_shown", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>max_percent_shown</FieldLabel>
                    <FieldDescription>Obere Grenze für den Nutzungsanteil.</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricingConfig.max_percent_shown}
                    onChange={(e) =>
                      handlePricingChange("max_percent_shown", e.target.value)
                    }
                  />
                </Field>
              </FieldSet>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branchen CPM / RPM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {nicheRows.map((niche) => {
                  const override = nicheRpmOverrides[niche.id];
                  const currentValue =
                    typeof override === "number" && Number.isFinite(override)
                      ? override
                      : niche.rpm;

                  return (
                    <Field key={niche.id} className="rounded-lg border border-border/60 p-3">
                      <FieldContent>
                        <FieldLabel>{niche.name_de}</FieldLabel>
                        <FieldDescription>
                          Standard: {niche.rpm.toFixed(2)} EUR
                        </FieldDescription>
                      </FieldContent>
                      <Input
                        type="number"
                        step="0.01"
                        value={currentValue}
                        onChange={(e) =>
                          handleNicheRpmChange(niche.id, e.target.value, niche.rpm)
                        }
                      />
                    </Field>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nutzungs-Policy (config-driven)</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldSet className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldContent>
                    <FieldLabel>allowed_platform_scopes</FieldLabel>
                    <FieldDescription>Erlaubte Plattform-Scope Tokens (kommagetrennt).</FieldDescription>
                  </FieldContent>
                  <Input
                    value={toListInput(usagePolicyConfig.allowed_platform_scopes)}
                    onChange={(e) =>
                      handleUsagePolicyListChange(
                        "allowed_platform_scopes",
                        e.target.value,
                        DEFAULT_USAGE_POLICY_CONFIG.allowed_platform_scopes,
                      )
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>allowed_usage_modes</FieldLabel>
                    <FieldDescription>Erlaubte Nutzungsmodi (kommagetrennt).</FieldDescription>
                  </FieldContent>
                  <Input
                    value={toListInput(usagePolicyConfig.allowed_usage_modes)}
                    onChange={(e) =>
                      handleUsagePolicyListChange(
                        "allowed_usage_modes",
                        e.target.value,
                        DEFAULT_USAGE_POLICY_CONFIG.allowed_usage_modes,
                      )
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>allowed_license_durations</FieldLabel>
                    <FieldDescription>Erlaubte Lizenzlaufzeiten (kommagetrennt).</FieldDescription>
                  </FieldContent>
                  <Input
                    value={toListInput(usagePolicyConfig.allowed_license_durations)}
                    onChange={(e) =>
                      handleUsagePolicyListChange(
                        "allowed_license_durations",
                        e.target.value,
                        DEFAULT_USAGE_POLICY_CONFIG.allowed_license_durations,
                      )
                    }
                  />
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>max_subscription_billing_months</FieldLabel>
                    <FieldDescription>Maximale abrechenbare Monate im Abo-Modell.</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    step="1"
                    value={usagePolicyConfig.max_subscription_billing_months}
                    onChange={(e) =>
                      handleUsagePolicyNumberChange(
                        "max_subscription_billing_months",
                        e.target.value,
                      )
                    }
                  />
                </Field>

                <Field className="md:col-span-2">
                  <FieldContent>
                    <FieldLabel>allow_exclusive</FieldLabel>
                    <FieldDescription>
                      Wenn aktiviert, sind exklusive Lizenz-Optionen zulässig.
                    </FieldDescription>
                  </FieldContent>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={usagePolicyConfig.allow_exclusive}
                      onChange={(e) =>
                        handleUsagePolicyBooleanChange(
                          "allow_exclusive",
                          e.target.checked,
                        )
                      }
                    />
                    Exklusive Lizenzen erlauben
                  </label>
                </Field>
              </FieldSet>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktionen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={updateMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Defaults laden
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Speichern
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktive Version</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldSet>
                <Field>
                  <FieldLegend variant="label">Metadaten</FieldLegend>
                  <FieldDescription>
                    Settings-ID: <span className="font-mono">{data?.id || "default"}</span>
                  </FieldDescription>
                  <FieldDescription>
                    Letzte Aktualisierung: {data?.updated_at ? new Date(data.updated_at).toLocaleString("de-DE") : "-"}
                  </FieldDescription>
                </Field>
              </FieldSet>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
