import type { PriceResult } from "@/hooks/videoDetails/getPrices";
import type { ResolvedAlgorithmSettings } from "@/types/algorithmSettings";

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
  algorithmSettings?: ResolvedAlgorithmSettings | null;
}

const pickNumberish = (value: unknown): number | null => {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) ? value : null;
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
  algorithmSettings,
}: BuildAlgorithmInputSnapshotParams): Record<string, unknown> => {
  return {
    schema_version: 1,
    captured_at: new Date().toISOString(),
    settings_reference: {
      settings_id: algorithmSettings?.id ?? "default",
      settings_updated_at: algorithmSettings?.updated_at ?? null,
      simple_share_config: algorithmSettings?.simpleShareConfig ?? null,
      pricing_config: algorithmSettings?.pricingConfig ?? null,
      niche_rpm_overrides: algorithmSettings?.nicheRpmOverrides ?? null,
    },
    contract_selection: {
      selected_plan: selectedPlan,
      pricing_model_type: pricingModelType,
      selected_price: selectedPrice,
      creator_min_price: creatorMinPrice,
      selected_reaction_video_id: selectedReactionVideoId,
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
