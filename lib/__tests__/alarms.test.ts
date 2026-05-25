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

  it("does not add browser_fallback_url (avoids PWA reload loop)", () => {
    const ts = new Date(2026, 4, 20, 8, 5, 0, 0).getTime();
    const uri = buildPrimaryAndroidAlarmUri(ts, "test");
    expect(uri).not.toContain("browser_fallback_url");
  });
});

describe("getAndroidAlarmHref", () => {
  it("uses legacy set_alarm intent format", () => {
    const ts = new Date(2026, 4, 20, 8, 5, 0, 0).getTime();
    const href = getAndroidAlarmHref(ts, "test");
    expect(href).toContain("intent://set_alarm");
    expect(href).toContain("SET_ALARM");
  });
});

describe("generateIcsBlobUrl", () => {
  it("returns a blob URL", () => {
    const url = generateIcsBlobUrl(Date.now() + 3600000, "Fold", "desc");
    expect(url).toMatch(/^blob:/);
  });
});
