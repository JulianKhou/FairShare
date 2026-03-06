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
}

export interface AlgorithmSettingsRow {
  id: string;
  simple_share_config: Partial<SimpleShareConfig> | null;
  pricing_config: Partial<PricingConfig> | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface ResolvedAlgorithmSettings {
  id: string;
  simpleShareConfig: SimpleShareConfig;
  pricingConfig: PricingConfig;
  updated_at?: string;
  updated_by?: string | null;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  min_one_time_price: 0.5,
  default_base_views: 10000,
  min_percent_shown: 0.1,
  max_percent_shown: 1,
  assumed_percent_shown: 0.5,
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== "number") return fallback;
  return Number.isFinite(value) ? value : fallback;
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
  };
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
    updated_at: row?.updated_at,
    updated_by: row?.updated_by ?? null,
  };
};

export const DEFAULT_RESOLVED_ALGORITHM_SETTINGS: ResolvedAlgorithmSettings = {
  id: "default",
  simpleShareConfig: DEFAULT_SIMPLE_SHARE_CONFIG,
  pricingConfig: DEFAULT_PRICING_CONFIG,
  updated_at: undefined,
  updated_by: null,
};
