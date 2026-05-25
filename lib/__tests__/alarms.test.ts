import { describe, expect, it } from "vitest";
import {
  buildAndroidAlarmIntents,
  buildPrimaryAndroidAlarmUri,
  generateIcsBlobUrl,
  getAndroidAlarmHref,
} from "@/lib/alarms";

describe("buildPrimaryAndroidAlarmUri", () => {
  it("uses set_alarm intent with local hours from timestamp", () => {
    const ts = new Date(2026, 4, 20, 14, 30, 0, 0).getTime();
    const uri = buildPrimaryAndroidAlarmUri(ts, "קיפול 1");
    expect(uri).toContain("intent://set_alarm?hour=14&minute=30");
    expect(uri).not.toContain("skip_ui");
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

  it("adds browser_fallback_url when fallback provided", () => {
    const ts = new Date(2026, 4, 20, 8, 5, 0, 0).getTime();
    const uri = buildPrimaryAndroidAlarmUri(ts, "test", "https://example.com/app");
    expect(uri).toContain("S.browser_fallback_url=");
    expect(uri).toContain(encodeURIComponent("https://example.com/app"));
  });
});

describe("getAndroidAlarmHref", () => {
  it("prefers Google Deskclock package intent", () => {
    const ts = new Date(2026, 4, 20, 8, 5, 0, 0).getTime();
    const href = getAndroidAlarmHref(ts, "test");
    expect(href).toContain("com.google.android.deskclock");
    expect(href).toContain("SET_ALARM");
  });
});

describe("generateIcsBlobUrl", () => {
  it("returns a blob URL", () => {
    const url = generateIcsBlobUrl(Date.now() + 3600000, "Fold", "desc");
    expect(url).toMatch(/^blob:/);
  });
});
