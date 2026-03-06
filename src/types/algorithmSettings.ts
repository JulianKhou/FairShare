import {
  DEFAULT_SIMPLE_SHARE_CONFIG,
  normalizeSimpleShareConfig,
  type SimpleShareConfig,
} from "@/services/simpleShareAlgo";

export interface PricingConfig {
  min_one_time_price: number;
  default_base_views: number;
  min_percent_shown: number;
  max_percent_shown: number;
  assumed_percent_shown: number;
  platform_fee_percent: number;
}

export interface UsagePolicyConfig {
  allowed_platform_scopes: string[];
  allowed_usage_modes: string[];
  allow_exclusive: boolean;
  allowed_license_durations: string[];
  max_subscription_billing_months: number;
}

export type NicheRpmOverrides = Record<string, number>;

export interface AlgorithmSettingsRow {
  id: string;
  simple_share_config: Partial<SimpleShareConfig> | null;
  pricing_config: Partial<PricingConfig> | null;
  niche_rpm_overrides: NicheRpmOverrides | null;
  usage_policy_config: Partial<UsagePolicyConfig> | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface ResolvedAlgorithmSettings {
  id: string;
  simpleShareConfig: SimpleShareConfig;
  pricingConfig: PricingConfig;
  nicheRpmOverrides: NicheRpmOverrides;
  usagePolicyConfig: UsagePolicyConfig;
  updated_at?: string;
  updated_by?: string | null;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  min_one_time_price: 0.5,
  default_base_views: 10000,
  min_percent_shown: 0.1,
  max_percent_shown: 1,
  assumed_percent_shown: 0.5,
  platform_fee_percent: 0.1,
};

export const DEFAULT_USAGE_POLICY_CONFIG: UsagePolicyConfig = {
  allowed_platform_scopes: ["youtube_only"],
  allowed_usage_modes: ["reaction_only"],
  allow_exclusive: false,
  allowed_license_durations: ["unlimited"],
  max_subscription_billing_months: 12,
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== "number") return fallback;
  return Number.isFinite(value) ? value : fallback;
};

const normalizeStringList = (
  raw: unknown,
  fallback: string[],
): string[] => {
  if (!Array.isArray(raw)) return fallback;

  const normalized = raw
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter((item) => item.length > 0);

  return normalized.length > 0 ? [...new Set(normalized)] : fallback;
};

export const normalizePricingConfig = (
  raw?: Partial<PricingConfig> | null,
): PricingConfig => {
  const config = raw ?? {};

  const minPercentShown = Math.max(
    0,
    Math.min(
      1,
      toFiniteNumber(
        config.min_percent_shown,
        DEFAULT_PRICING_CONFIG.min_percent_shown,
      ),
    ),
  );
  const maxPercentShown = Math.max(
    minPercentShown,
    Math.min(
      1,
      toFiniteNumber(
        config.max_percent_shown,
        DEFAULT_PRICING_CONFIG.max_percent_shown,
      ),
    ),
  );

  return {
    min_one_time_price: Math.max(
      0,
      toFiniteNumber(
        config.min_one_time_price,
        DEFAULT_PRICING_CONFIG.min_one_time_price,
      ),
    ),
    default_base_views: Math.max(
      100,
      Math.round(
        toFiniteNumber(
          config.default_base_views,
          DEFAULT_PRICING_CONFIG.default_base_views,
        ),
      ),
    ),
    min_percent_shown: minPercentShown,
    max_percent_shown: maxPercentShown,
    assumed_percent_shown: Math.max(
      minPercentShown,
      Math.min(
        maxPercentShown,
        toFiniteNumber(
          config.assumed_percent_shown,
          DEFAULT_PRICING_CONFIG.assumed_percent_shown,
        ),
      ),
    ),
    platform_fee_percent: Math.max(
      0,
      Math.min(
        0.95,
        toFiniteNumber(
          config.platform_fee_percent,
          DEFAULT_PRICING_CONFIG.platform_fee_percent,
        ),
      ),
    ),
  };
};

export const normalizeUsagePolicyConfig = (
  raw?: Partial<UsagePolicyConfig> | null,
): UsagePolicyConfig => {
  const config = raw ?? {};

  return {
    allowed_platform_scopes: normalizeStringList(
      config.allowed_platform_scopes,
      DEFAULT_USAGE_POLICY_CONFIG.allowed_platform_scopes,
    ),
    allowed_usage_modes: normalizeStringList(
      config.allowed_usage_modes,
      DEFAULT_USAGE_POLICY_CONFIG.allowed_usage_modes,
    ),
    allow_exclusive:
      typeof config.allow_exclusive === "boolean"
        ? config.allow_exclusive
        : DEFAULT_USAGE_POLICY_CONFIG.allow_exclusive,
    allowed_license_durations: normalizeStringList(
      config.allowed_license_durations,
      DEFAULT_USAGE_POLICY_CONFIG.allowed_license_durations,
    ),
    max_subscription_billing_months: Math.max(
      1,
      Math.round(
        toFiniteNumber(
          config.max_subscription_billing_months,
          DEFAULT_USAGE_POLICY_CONFIG.max_subscription_billing_months,
        ),
      ),
    ),
  };
};

export const normalizeNicheRpmOverrides = (
  raw?: NicheRpmOverrides | null,
): NicheRpmOverrides => {
  const normalized: NicheRpmOverrides = {};
  const source = raw ?? {};

  for (const [key, value] of Object.entries(source)) {
    if (!key) continue;
    if (typeof value !== "number") continue;
    if (!Number.isFinite(value)) continue;
    normalized[key] = Math.max(0, value);
  }

  return normalized;
};

export const resolveAlgorithmSettings = (
  row?: AlgorithmSettingsRow | null,
): ResolvedAlgorithmSettings => {
  return {
    id: row?.id || "default",
    simpleShareConfig: normalizeSimpleShareConfig(
      row?.simple_share_config ?? undefined,
    ),
    pricingConfig: normalizePricingConfig(row?.pricing_config ?? undefined),
    nicheRpmOverrides: normalizeNicheRpmOverrides(
      row?.niche_rpm_overrides ?? undefined,
    ),
    usagePolicyConfig: normalizeUsagePolicyConfig(
      row?.usage_policy_config ?? undefined,
    ),
    updated_at: row?.updated_at,
    updated_by: row?.updated_by ?? null,
  };
};

export const DEFAULT_RESOLVED_ALGORITHM_SETTINGS: ResolvedAlgorithmSettings = {
  id: "default",
  simpleShareConfig: DEFAULT_SIMPLE_SHARE_CONFIG,
  pricingConfig: DEFAULT_PRICING_CONFIG,
  nicheRpmOverrides: {},
  usagePolicyConfig: DEFAULT_USAGE_POLICY_CONFIG,
  updated_at: undefined,
  updated_by: null,
};
