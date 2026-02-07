import { calculateFairShare } from "../../services/fairShareAlgo";
import { useEffect } from "react";
import { useState } from "react";
import { getNicheRPM } from "../../data/NicheData";

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
interface fairShareParams {
  viewsReactor: number;
  viewsCreator: number;
  durationReactorSeconds: number;
  durationCreatorSeconds: number;
  percentShown: number;
  daysSinceUpload: number;
}

export function getPrices(videoReactor: any, videoCreator: any) {
  const prices: Price = {
    oneTime: 0,
    payPerViews: 0,
    payPerCpm: 0,
  };
  const fairShareParams: fairShareParams = {
    viewsReactor: videoReactor.views || 0,
    viewsCreator: videoCreator.views || 0,
    durationReactorSeconds: videoReactor.duration_seconds || 10, // Fallback to 10 min to avoid div/0
    durationCreatorSeconds: videoCreator.duration_seconds || 10,
    percentShown: videoReactor.duration_seconds / videoCreator.duration_seconds || 1, // Default 50%
    daysSinceUpload: videoCreator.daysSinceUpload || 0,
  };
  const nicheRPM = getNicheRPM(Number(videoReactor.category_id));
  const fairShare = calculateFairShare(fairShareParams);

  console.group("getPrices Debug");
  console.log("Niche RPM:", nicheRPM);
  console.log("FairShare:", fairShare);
  console.groupEnd();

  try {
    if (nicheRPM != null) {
      // One Time Payment: Based on Creator's "Average" performance (Buyout Price)
      // Fallback to current views or 10k if average is missing.
      const baseViews = videoCreator.averageViewsPerCategory || videoCreator.views || 10000;

      // Formula: (Estimated Views * FairShare * RPM) / 1000
      prices.oneTime = (baseViews * fairShare * nicheRPM) / 1000;

      // PayPerView: Price per 1000 Views
      // Formula: FairShare * RPM
      prices.payPerViews = fairShare * nicheRPM;

      // CPM: Same as above (displayed differently or conceptually linked)
      prices.payPerCpm = fairShare * nicheRPM;
    }
    return prices;

  } catch (error) {
    console.log(error);
    prices.oneTime = 0;
    prices.payPerViews = 0;
    prices.payPerCpm = 0;
    return prices;
  }
};
