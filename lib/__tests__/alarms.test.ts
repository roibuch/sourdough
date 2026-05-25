import { describe, expect, it } from "vitest";
import {
  buildAndroidAlarmIntents,
  buildPrimaryAndroidAlarmUri,
  generateIcsBlobUrl,
} from "@/lib/alarms";

describe("buildPrimaryAndroidAlarmUri", () => {
  it("uses set_alarm intent with local hours from timestamp", () => {
    const ts = new Date(2026, 4, 20, 14, 30, 0, 0).getTime();
    const uri = buildPrimaryAndroidAlarmUri(ts, "קיפול 1");
    expect(uri).toContain("intent://set_alarm?hour=14&minute=30");
    expect(uri).toContain("skip_ui=true");
    expect(uri).toContain("action=android.intent.action.SET_ALARM");
    expect(uri).toContain(encodeURIComponent("קיפול 1"));
  });
});

describe("buildAndroidAlarmIntents", () => {
  it("lists primary URI first", () => {
    const ts = new Date(2026, 4, 20, 8, 5, 0, 0).getTime();
    const uris = buildAndroidAlarmIntents(ts, "test");
    expect(uris[0]).toBe(buildPrimaryAndroidAlarmUri(ts, "test"));
    expect(uris.length).toBeGreaterThan(1);
  });
});

describe("generateIcsBlobUrl", () => {
  it("returns a blob URL", () => {
    const url = generateIcsBlobUrl(Date.now() + 3600000, "Fold", "desc");
    expect(url).toMatch(/^blob:/);
  });
});
