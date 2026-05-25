import { describe, expect, it } from "vitest";
import {
  buildAndroidAlarmIntents,
  buildPrimaryAndroidAlarmUri,
} from "@/lib/alarms";

describe("buildPrimaryAndroidAlarmUri", () => {
  it("uses legacy set_alarm intent format", () => {
    const uri = buildPrimaryAndroidAlarmUri(14, 30, "קיפול 1");
    expect(uri).toContain("intent://set_alarm?hour=14&minute=30");
    expect(uri).toContain("action=android.intent.action.SET_ALARM");
    expect(uri).toContain(encodeURIComponent("קיפול 1"));
  });

  it("clamps hour and minute", () => {
    const uri = buildPrimaryAndroidAlarmUri(25, 99, "x");
    expect(uri).toContain("hour=23");
    expect(uri).toContain("minute=59");
  });
});

describe("buildAndroidAlarmIntents", () => {
  it("lists primary URI first", () => {
    const uris = buildAndroidAlarmIntents(8, 5, "test");
    expect(uris[0]).toBe(buildPrimaryAndroidAlarmUri(8, 5, "test"));
    expect(uris.length).toBeGreaterThan(1);
  });
});
