export interface SimpleShareConfig {
  BASE_SHARE: number;
  HYPE_DECAY_DAYS: number;
  HYPE_FACTOR: number;
  EVERGREEN_DAYS: number;
  EVERGREEN_FACTOR: number;
}

export interface SimpleShareParams {
  viewsReactor: number;
  viewsCreator: number;
  durationReactorSeconds: number;
  durationCreatorSeconds: number;
  percentShown: number;
  daysSinceUpload: number;
}

export const DEFAULT_SIMPLE_SHARE_CONFIG: SimpleShareConfig = {
  BASE_SHARE: 0.5,
  HYPE_DECAY_DAYS: 7,
  HYPE_FACTOR: 1.5,
  EVERGREEN_DAYS: 30,
  EVERGREEN_FACTOR: 0.8,
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== "number") return fallback;
  return Number.isFinite(value) ? value : fallback;
};

export const normalizeSimpleShareConfig = (
  raw?: Partial<SimpleShareConfig>,
): SimpleShareConfig => {
  const cfg = raw ?? {};

  return {
    BASE_SHARE: Math.max(0, Math.min(1, toFiniteNumber(cfg.BASE_SHARE, DEFAULT_SIMPLE_SHARE_CONFIG.BASE_SHARE))),
    HYPE_DECAY_DAYS: Math.max(1, Math.round(toFiniteNumber(cfg.HYPE_DECAY_DAYS, DEFAULT_SIMPLE_SHARE_CONFIG.HYPE_DECAY_DAYS))),
    HYPE_FACTOR: Math.max(1, toFiniteNumber(cfg.HYPE_FACTOR, DEFAULT_SIMPLE_SHARE_CONFIG.HYPE_FACTOR)),
    EVERGREEN_DAYS: Math.max(1, Math.round(toFiniteNumber(cfg.EVERGREEN_DAYS, DEFAULT_SIMPLE_SHARE_CONFIG.EVERGREEN_DAYS))),
    EVERGREEN_FACTOR: Math.max(0, Math.min(1.5, toFiniteNumber(cfg.EVERGREEN_FACTOR, DEFAULT_SIMPLE_SHARE_CONFIG.EVERGREEN_FACTOR))),
  };
};

export const calculateSimpleShare = (
  params: SimpleShareParams,
  configOverride?: Partial<SimpleShareConfig>,
): number => {
  const config = normalizeSimpleShareConfig(configOverride);

  const {
    viewsReactor,
    viewsCreator,
    durationReactorSeconds,
    durationCreatorSeconds,
    percentShown,
    daysSinceUpload,
  } = params;

  const safeReactDuration = Math.max(durationReactorSeconds, 0.1);
  const safeCreatorDuration = Math.max(durationCreatorSeconds, 0.1);
  const safeCreatorViews = Math.max(viewsCreator, 1);
  const safeReactViews = Math.max(viewsReactor, 0);
  const safePercentShown = Math.max(0, Math.min(1, percentShown));

  let timeFactor = 1;
  if (daysSinceUpload < config.HYPE_DECAY_DAYS) {
    const decayProgress = daysSinceUpload / config.HYPE_DECAY_DAYS;
    timeFactor = config.HYPE_FACTOR - decayProgress * (config.HYPE_FACTOR - 1);
  } else if (daysSinceUpload > config.EVERGREEN_DAYS) {
    timeFactor = config.EVERGREEN_FACTOR;
  }

  const transformFactor = safeCreatorDuration / safeReactDuration;

  const contentScore =
    config.BASE_SHARE * safePercentShown * transformFactor * timeFactor;

  const ratio = safeReactViews / safeCreatorViews;
  let discountFactor = 1;

  if (ratio > 1) {
    discountFactor = 1 / (1 + Math.log10(ratio));
  }

  const finalShare = contentScore * discountFactor;

  return Math.min(Math.max(finalShare, 0), 1);
};
