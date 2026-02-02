import { calculateFairShare } from "../../services/fairShareAlgo";

interface Price {
  oneTime: number;
  payPerViews: number;
  payPerCpm: number;
}
interface VideoCreator {
  views: number;
  viewsCreator: number;
  averageViewsPerCategory: number;
  percentShown: number; //muss angepasst werden
  durationCreatorMinutes: number;
  daysSinceUpload: number;
}
interface VideoReactor {
  averageViewsPerCategory: number;
}
interface VideoCreator {
  averageViewsPerCategory: number;
  durationCreatorMinutes: number;
}

function getPrices(
  videoCreator: VideoCreator,
  videoReactor: VideoReactor,
): Price {
  const price = calculateFairShare({
    viewsReactor: videoReactor.averageViewsPerCategory,
    viewsCreator: videoCreator.viewsCreator,
    durationReactorMinutes: videoReactor.averageViewsPerCategory, //muss angepasst werden
    durationCreatorMinutes: videoCreator.durationCreatorMinutes,
    percentShown: 100, //muss angepasst werden
    daysSinceUpload: videoCreator.daysSinceUpload,
  });
  return {
    oneTime: price,
    payPerViews: price,
    payPerCpm: price,
  };
}
