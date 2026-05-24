import type { AlarmEvent, DoughWorkflow, WorkflowSchedule } from "./types";

export function parseIntervalMinutes(str: string): number {
  const nums = (str || "").match(/\d+/g);
  if (!nums?.length) return 40;
  if (nums.length === 1) return parseInt(nums[0], 10);
  return (parseInt(nums[0], 10) + parseInt(nums[1], 10)) / 2;
}

export function parseFoldCount(str: string): number {
  const nums = (str || "").match(/\d+/g);
  if (!nums?.length) return 3;
  return parseInt(nums[0], 10);
}

interface TimelineAnchors {
  tBulkStart: number;
  tBulkEnd: number;
  tAutolyseStart: number;
  tStarterFeed: number;
  bulkH: number;
}

export function buildWorkflowSchedule(
  workflow: DoughWorkflow,
  anchors: TimelineAnchors | null,
): WorkflowSchedule | null {
  if (!anchors) return null;
  const foldEveryMin = parseIntervalMinutes(workflow.foldEvery);
  const foldCount = parseFoldCount(workflow.foldCount);
  const folds: AlarmEvent[] = [];

  for (let i = 0; i < foldCount; i++) {
    folds.push({
      ts: anchors.tBulkStart + (i + 1) * foldEveryMin * 60_000,
      message: `קיפול בצק ${i + 1}`,
      short: `קיפול ${i + 1}`,
    });
  }

  return {
    bulkStart: anchors.tBulkStart,
    bulkEnd: anchors.tBulkEnd,
    folds,
    endBulk: {
      ts: anchors.tBulkEnd,
      message: "סיום התפחה ראשונית",
      short: "סיום התפחה בקערה",
    },
  };
}

