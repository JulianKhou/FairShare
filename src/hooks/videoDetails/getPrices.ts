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

  const oneTime = Math.max(
    (baseViews * simpleShare * nicheRPM) / 1000,
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
