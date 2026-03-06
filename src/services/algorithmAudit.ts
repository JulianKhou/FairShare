import type { PriceResult } from "@/hooks/videoDetails/getPrices";
import type { ResolvedAlgorithmSettings } from "@/types/algorithmSettings";
import type { UsageSelection } from "@/services/usagePolicy";

const ALGORITHM_BASE_VERSION = "simpleshare-v1";

interface BuildAlgorithmInputSnapshotParams {
  videoCreator: any;
  videoReactor: any;
  selectedReactionVideoId: string;
  selectedPlan: "fixed" | "views";
  pricingModelType: 1 | 2 | 3;
  selectedPrice: number;
  creatorMinPrice: number;
  rawPrices: PriceResult;
  prices: {
    oneTime: number;
    payPerViews: number;
    payPerCpm?: number;
  };
  usageSelection: UsageSelection;
  algorithmSettings?: ResolvedAlgorithmSettings | null;
}

const pickNumberish = (value: unknown): number | null => {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) ? value : null;
};

const pickBooleanish = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1", "monetized"].includes(normalized)) return true;
    if (["false", "no", "0", "not_monetized", "demonetized"].includes(normalized)) {
      return false;
    }
  }

  return null;
};

const toVideoInputSnapshot = (video: any) => ({
  id: video?.id ?? null,
  creator_id: video?.creator_id ?? null,
  category_id: pickNumberish(video?.category_id),
  published_at: video?.published_at ?? null,
  duration_seconds:
    pickNumberish(video?.duration_seconds) ?? pickNumberish(video?.durationSeconds),
  views_candidates: {
    averageViewsPerCategory: pickNumberish(video?.averageViewsPerCategory),
    last_view_count: pickNumberish(video?.last_view_count),
    view_count_at_listing: pickNumberish(video?.view_count_at_listing),
    views: pickNumberish(video?.views),
    viewCount: pickNumberish(video?.viewCount),
  },
});

export const buildAlgorithmVersion = (
  algorithmSettings?: Pick<ResolvedAlgorithmSettings, "updated_at"> | null,
): string => {
  const suffix = algorithmSettings?.updated_at ?? "default";
  return `${ALGORITHM_BASE_VERSION}@${suffix}`;
};

export const buildAlgorithmInputSnapshot = ({
  videoCreator,
  videoReactor,
  selectedReactionVideoId,
  selectedPlan,
  pricingModelType,
  selectedPrice,
  creatorMinPrice,
  rawPrices,
  prices,
  usageSelection,
  algorithmSettings,
}: BuildAlgorithmInputSnapshotParams): Record<string, unknown> => {
  const monetizedHint = pickBooleanish(
    videoReactor?.is_monetized ??
      videoReactor?.monetized ??
      videoReactor?.isMonetized ??
      videoReactor?.monetization_enabled ??
      videoReactor?.monetization,
  );

  return {
    schema_version: 3,
    captured_at: new Date().toISOString(),
    settings_reference: {
      settings_id: algorithmSettings?.id ?? "default",
      settings_updated_at: algorithmSettings?.updated_at ?? null,
      simple_share_config: algorithmSettings?.simpleShareConfig ?? null,
      pricing_config: algorithmSettings?.pricingConfig ?? null,
      niche_rpm_overrides: algorithmSettings?.nicheRpmOverrides ?? null,
      usage_policy_config: algorithmSettings?.usagePolicyConfig ?? null,
    },
    usage_policy: algorithmSettings?.usagePolicyConfig ?? null,
    selected_usage: usageSelection,
    variable_inputs_used_for_pricing: {
      selected_plan: selectedPlan,
      pricing_model_type: pricingModelType,
      selected_price: selectedPrice,
      creator_min_price: creatorMinPrice,
      selected_reaction_video_id: selectedReactionVideoId,
      reactor_monetization_hint: monetizedHint,
    },
    video_inputs: {
      creator_video: toVideoInputSnapshot(videoCreator),
      reactor_video: toVideoInputSnapshot(videoReactor),
    },
    algorithm_outputs: {
      one_time: rawPrices.oneTime,
      pay_per_views: rawPrices.payPerViews,
      pay_per_cpm: rawPrices.payPerCpm,
      fairshare_score: rawPrices.fairshareScore,
      marktmacht_score: rawPrices.marktmachtScore,
      schoepferische_leistung_score: rawPrices.schoepferischeLeistungScore,
      one_time_after_floor: prices.oneTime,
      pay_per_views_final: prices.payPerViews,
    },
  };
};
