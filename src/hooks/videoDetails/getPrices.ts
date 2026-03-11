import { calculateSimpleShare } from "@/services/simpleShareAlgo";
import {
  DEFAULT_NICHE_DATA,
  findNicheByYouTubeId,
  getSeasonalityFactor,
} from "@/data/NicheData";
import {
  normalizePricingConfig,
  type NicheRpmOverrides,
  type PricingConfig,
} from "@/types/algorithmSettings";
import type { SimpleShareConfig } from "@/services/simpleShareAlgo";

export interface PriceResult {
  oneTime: number;
  payPerViews: number;
  payPerCpm: number;
  fairshareScore: number;
  marktmachtScore: number;
  schoepferischeLeistungScore: number;
}

interface PricingSettingsInput {
  simpleShareConfig?: Partial<SimpleShareConfig>;
  pricingConfig?: Partial<PricingConfig>;
  nicheRpmOverrides?: NicheRpmOverrides;
}

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) ? value : null;
};

const firstFiniteNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const parsed = toFiniteNumber(value);
    if (parsed !== null) return parsed;
  }
  return null;
};

const pickViews = (video: any): number => {
  return Math.max(
    0,
    firstFiniteNumber(
      video?.averageViewsPerCategory,
      video?.last_view_count,
      video?.view_count_at_listing,
      video?.views,
      video?.viewCount,
    ) ?? 0,
  );
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getDaysSinceUpload = (publishedAt: unknown): number => {
  if (typeof publishedAt !== "string") return 0;
  const timestamp = Date.parse(publishedAt);
  if (Number.isNaN(timestamp)) return 0;
  const diff = Date.now() - timestamp;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const getLowViewDiscount = (
  baseViews: number,
  referenceViews: number,
): number => {
  const safeBaseViews = Math.max(0, baseViews);
  const safeReferenceViews = Math.max(1, referenceViews);

  // Damp low-view contracts so small channels are not priced too aggressively.
  const normalized = safeBaseViews / safeReferenceViews;
  return clamp(Math.pow(normalized, 0.35), 0.35, 1);
};

const LOW_VIEW_PRICE_CEILINGS = [
  { maxViews: 5000, maxOneTimeBase: 6 },
  { maxViews: 20000, maxOneTimeBase: 18 },
] as const;

const HIGH_VIEW_GROWTH_EXPONENT = 0.72;
const DEFAULT_MAX_REACTOR_REVENUE_SHARE = 0.45;

const getScaledBaseViews = (
  baseViews: number,
  referenceViews: number,
): number => {
  const safeBaseViews = Math.max(0, baseViews);
  const safeReferenceViews = Math.max(1, referenceViews);

  // Keep low-view behavior unchanged, but damp growth above the reference level.
  if (safeBaseViews <= safeReferenceViews) return safeBaseViews;

  const normalized = safeBaseViews / safeReferenceViews;
  return safeReferenceViews * Math.pow(normalized, HIGH_VIEW_GROWTH_EXPONENT);
};

const getMarketBalancedViews = (
  scaledCreatorViews: number,
  reactorViews: number,
  referenceViews: number,
): number => {
  const safeCreatorViews = Math.max(0, scaledCreatorViews);
  const safeReactorViews = Math.max(0, reactorViews);

  // Ensure the pricing base follows both creator demand and reactor monetization potential.
  const reactorFloor = Math.max(safeReactorViews, referenceViews * 0.25);
  return Math.sqrt(safeCreatorViews * reactorFloor);
};

const getLowViewPriceCeiling = (baseViews: number, nicheRPM: number): number => {
  const safeBaseViews = Math.max(0, baseViews);

  const tier = LOW_VIEW_PRICE_CEILINGS.find((item) => safeBaseViews <= item.maxViews);
  if (!tier) return Number.POSITIVE_INFINITY;

  // Keep niche spread, but avoid extreme low-view prices in high-RPM niches.
  const rpmScale = clamp(nicheRPM / 3.3, 0.7, 2.2);
  return tier.maxOneTimeBase * rpmScale;
};

const getPercentShown = (
  reactionDuration: number,
  creatorDuration: number,
  pricingConfig: PricingConfig,
): number => {
  const assumed = clamp(
    pricingConfig.assumed_percent_shown,
    pricingConfig.min_percent_shown,
    pricingConfig.max_percent_shown,
  );

  if (reactionDuration <= 0 || creatorDuration <= 0) {
    return assumed;
  }

  const byDuration = clamp(
    reactionDuration / creatorDuration,
    pricingConfig.min_percent_shown,
    pricingConfig.max_percent_shown,
  );

  return clamp(
    (assumed + byDuration) / 2,
    pricingConfig.min_percent_shown,
    pricingConfig.max_percent_shown,
  );
};

export function getPrices(
  videoReactor: any,
  videoCreator: any,
  settings?: PricingSettingsInput | null,
): PriceResult {
  const pricingConfig = normalizePricingConfig(settings?.pricingConfig);

  const creatorViews = pickViews(videoCreator);
  const reactorViews = pickViews(videoReactor);

  const creatorDuration = Math.max(
    1,
    firstFiniteNumber(videoCreator?.duration_seconds, videoCreator?.durationSeconds) ?? 1,
  );
  const reactorDuration = Math.max(
    1,
    firstFiniteNumber(videoReactor?.duration_seconds, videoReactor?.durationSeconds) ?? 1,
  );

  const daysSinceUpload = getDaysSinceUpload(videoCreator?.published_at);
  const percentShown = getPercentShown(
    reactorDuration,
    creatorDuration,
    pricingConfig,
  );

  const nicheCategory = Number(videoCreator?.category_id ?? videoReactor?.category_id);
  const resolvedNiche = Number.isFinite(nicheCategory)
    ? findNicheByYouTubeId(nicheCategory) || DEFAULT_NICHE_DATA
    : DEFAULT_NICHE_DATA;
  const overriddenRpm = settings?.nicheRpmOverrides?.[resolvedNiche.id];
  const baseRpm =
    typeof overriddenRpm === "number" && Number.isFinite(overriddenRpm)
      ? Math.max(0, overriddenRpm)
      : resolvedNiche.rpm;
  const nicheRPM = baseRpm * getSeasonalityFactor();

  const simpleShare = calculateSimpleShare(
    {
      viewsReactor: reactorViews,
      viewsCreator: creatorViews,
      durationReactorSeconds: reactorDuration,
      durationCreatorSeconds: creatorDuration,
      percentShown,
      daysSinceUpload,
    },
    settings?.simpleShareConfig,
  );

  const baseViews = Math.max(
    0,
    firstFiniteNumber(
      videoCreator?.averageViewsPerCategory,
      videoCreator?.last_view_count,
      videoCreator?.views,
      pricingConfig.default_base_views,
    ) ?? pricingConfig.default_base_views,
  );

  const referenceViews = pricingConfig.default_base_views;
  const scaledCreatorViews = getScaledBaseViews(baseViews, referenceViews);
  const marketBalancedViews = getMarketBalancedViews(
    scaledCreatorViews,
    reactorViews,
    referenceViews,
  );

  const lowViewDiscount = getLowViewDiscount(baseViews, referenceViews);

  const oneTimeRaw =
    ((marketBalancedViews * simpleShare * nicheRPM) / 1000) * lowViewDiscount;
  const lowViewCeiling = getLowViewPriceCeiling(baseViews, nicheRPM);
  const estimatedReactorRevenue = (reactorViews * nicheRPM) / 1000;
  const reactorRevenueShare = clamp(
    pricingConfig.max_reactor_revenue_share ?? DEFAULT_MAX_REACTOR_REVENUE_SHARE,
    0.05,
    0.95,
  );
  const reactorRevenueCap = Math.max(
    pricingConfig.min_one_time_price,
    estimatedReactorRevenue * reactorRevenueShare,
  );

  const oneTime = Math.max(
    Math.min(oneTimeRaw, lowViewCeiling, reactorRevenueCap),
    pricingConfig.min_one_time_price,
  );

  const payPerViews = Math.max(0, simpleShare * nicheRPM);
  const fairshareScore = Math.round(simpleShare * 10000) / 100;

  const sizeRatio = reactorViews / Math.max(creatorViews, 1);
  const marktmachtScore = Math.round(
    clamp((1 / (1 + Math.log10(Math.max(sizeRatio, 1)))) * 100, 0, 100) * 100,
  ) / 100;

  const schoepferischeLeistungScore =
    Math.round(clamp((1 - percentShown) * 100, 0, 100) * 100) / 100;

  return {
    oneTime,
    payPerViews,
    payPerCpm: payPerViews,
    fairshareScore,
    marktmachtScore,
    schoepferischeLeistungScore,
  };
}
