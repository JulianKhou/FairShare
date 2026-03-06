import {
  DEFAULT_USAGE_POLICY_CONFIG,
  normalizeUsagePolicyConfig,
  type UsagePolicyConfig,
} from "@/types/algorithmSettings";

export interface UsageSelection {
  platform_scope: string;
  usage_mode: string;
  exclusivity: boolean;
  license_duration: string;
  billing_duration_months: number | null;
}

const normalizeToken = (value: string): string => value.trim().toLowerCase();

export const buildDefaultUsageSelection = (
  pricingModelType: 1 | 2 | 3,
  rawPolicy?: Partial<UsagePolicyConfig> | null,
): UsageSelection => {
  const policy = normalizeUsagePolicyConfig(rawPolicy);

  return {
    platform_scope: policy.allowed_platform_scopes[0],
    usage_mode: policy.allowed_usage_modes[0],
    exclusivity: false,
    license_duration: policy.allowed_license_durations[0],
    billing_duration_months:
      pricingModelType === 1 ? null : policy.max_subscription_billing_months,
  };
};

export const validateUsageSelection = (
  selection: UsageSelection,
  pricingModelType: 1 | 2 | 3,
  rawPolicy?: Partial<UsagePolicyConfig> | null,
): string[] => {
  const errors: string[] = [];
  const policy = normalizeUsagePolicyConfig(rawPolicy);

  const platform = normalizeToken(selection.platform_scope);
  const mode = normalizeToken(selection.usage_mode);
  const licenseDuration = normalizeToken(selection.license_duration);

  if (!policy.allowed_platform_scopes.includes(platform)) {
    errors.push(`Plattform '${selection.platform_scope}' ist nicht erlaubt.`);
  }

  if (!policy.allowed_usage_modes.includes(mode)) {
    errors.push(`Nutzungsmodus '${selection.usage_mode}' ist nicht erlaubt.`);
  }

  if (!policy.allowed_license_durations.includes(licenseDuration)) {
    errors.push(`Laufzeit '${selection.license_duration}' ist nicht erlaubt.`);
  }

  if (selection.exclusivity && !policy.allow_exclusive) {
    errors.push("Exklusive Lizenzen sind derzeit nicht erlaubt.");
  }

  if (pricingModelType === 1) {
    if (selection.billing_duration_months !== null) {
      errors.push(
        "Einmalzahlung darf keine Billing-Dauer in Monaten enthalten.",
      );
    }
  } else {
    if (
      typeof selection.billing_duration_months !== "number" ||
      !Number.isFinite(selection.billing_duration_months)
    ) {
      errors.push("Abo-Modell benötigt eine gültige Billing-Dauer in Monaten.");
    } else {
      const billingMonths = Math.round(selection.billing_duration_months);
      if (billingMonths < 1) {
        errors.push("Billing-Dauer muss mindestens 1 Monat betragen.");
      }
      if (billingMonths > policy.max_subscription_billing_months) {
        errors.push(
          `Billing-Dauer darf maximal ${policy.max_subscription_billing_months} Monate betragen.`,
        );
      }
    }
  }

  return errors;
};

export const getPolicyForRuntime = (
  rawPolicy?: Partial<UsagePolicyConfig> | null,
): UsagePolicyConfig => {
  return normalizeUsagePolicyConfig(rawPolicy ?? DEFAULT_USAGE_POLICY_CONFIG);
};
