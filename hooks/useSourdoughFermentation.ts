"use client";

import { useMemo } from "react";
import {
  calculateAutolyseStartTime,
  expectedPeakTimeFromFeed,
  getBulkFermentationHours,
  getTimeToPeakHours,
  pickFeedingRatioForWindow,
  recommendFeedingRatio,
  type FeedingRatio,
  type RecommendedFeedingRatio,
} from "@/lib/sourdoughFermentation";

export interface UseSourdoughFermentationParams {
  /** 1:a:a — flour/water multipliers (defaults to auto-pick from window). */
  feedingRatio?: number | FeedingRatio;
  /** Dough / ambient temperature (°C). */
  tempC?: number;
  /** Baker's % starter in final dough. */
  starterPct?: number;
  /** Hours from feed until mix / autolyse (for ratio recommendation). */
  desiredHoursUntilMix?: number;
  /** If set with autolyse duration, computes autolyse start. */
  feedTime?: Date;
  expectedPeakTime?: Date;
  autolyseDurationHours?: number;
  autolyseDurationMinutes?: number;
}

export interface UseSourdoughFermentationResult {
  timeToPeak: ReturnType<typeof getTimeToPeakHours>;
  bulkFermentation: ReturnType<typeof getBulkFermentationHours> | null;
  recommendedRatio: RecommendedFeedingRatio | null;
  pickedRatio: ReturnType<typeof pickFeedingRatioForWindow> | null;
  autolyseStartTime: Date | null;
  expectedPeak: Date | null;
}

/**
 * React hook wrapping {@link @/lib/sourdoughFermentation} for UI components.
 */
export function useSourdoughFermentation(
  params: UseSourdoughFermentationParams = {},
): UseSourdoughFermentationResult {
  const {
    feedingRatio,
    tempC = 22,
    starterPct = 20,
    desiredHoursUntilMix,
    feedTime,
    expectedPeakTime,
    autolyseDurationHours,
    autolyseDurationMinutes,
  } = params;

  return useMemo(() => {
    const pickedRatio =
      desiredHoursUntilMix != null
        ? pickFeedingRatioForWindow(desiredHoursUntilMix, tempC)
        : null;

    const ratio =
      feedingRatio ??
      pickedRatio?.ratio ??
      recommendFeedingRatio(desiredHoursUntilMix ?? 8, tempC).ratio;

    const timeToPeak = getTimeToPeakHours(ratio, tempC);

    const bulkFermentation =
      starterPct > 0 ? getBulkFermentationHours(starterPct, tempC) : null;

    const recommendedRatio =
      desiredHoursUntilMix != null
        ? recommendFeedingRatio(desiredHoursUntilMix, tempC)
        : null;

    let expectedPeak: Date | null = expectedPeakTime ?? null;
    if (!expectedPeak && feedTime) {
      expectedPeak = expectedPeakTimeFromFeed(feedTime, timeToPeak.hours);
    }

    let autolyseStartTime: Date | null = null;
    if (
      expectedPeak &&
      ((autolyseDurationHours ?? 0) > 0 || (autolyseDurationMinutes ?? 0) > 0)
    ) {
      try {
        autolyseStartTime = calculateAutolyseStartTime({
          expectedStarterPeakTime: expectedPeak,
          autolyseDurationHours,
          autolyseDurationMinutes,
        });
      } catch {
        autolyseStartTime = null;
      }
    }

    return {
      timeToPeak,
      bulkFermentation,
      recommendedRatio,
      pickedRatio,
      autolyseStartTime,
      expectedPeak,
    };
  }, [
    feedingRatio,
    tempC,
    starterPct,
    desiredHoursUntilMix,
    feedTime,
    expectedPeakTime,
    autolyseDurationHours,
    autolyseDurationMinutes,
  ]);
}

export type {
  FeedingRatio,
  RecommendedFeedingRatio,
} from "@/lib/sourdoughFermentation";
