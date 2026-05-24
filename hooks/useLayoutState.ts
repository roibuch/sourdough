"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ALL_SECTION_IDS,
  type AppSectionId,
  type NavGroupId,
  NAV_GROUPS,
} from "@/lib/navigation/sections";

const STORAGE_SIDEBAR = "sourdough-sidebar-collapsed";
const STORAGE_GROUPS = "sourdough-nav-groups-collapsed";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function defaultGroupCollapsed(): Record<NavGroupId, boolean> {
  const map = {} as Record<NavGroupId, boolean>;
  for (const g of NAV_GROUPS) {
    map[g.id] = g.defaultCollapsed ?? false;
  }
  return map;
}

export function useLayoutState() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<AppSectionId>("ingredients");
  const [groupsCollapsed, setGroupsCollapsed] = useState<
    Record<NavGroupId, boolean>
  >(defaultGroupCollapsed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(readJson(STORAGE_SIDEBAR, false));
    setGroupsCollapsed(
      readJson(STORAGE_GROUPS, defaultGroupCollapsed()),
    );
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_SIDEBAR, JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_GROUPS, JSON.stringify(groupsCollapsed));
  }, [groupsCollapsed, hydrated]);

  const toggleGroup = useCallback((id: NavGroupId) => {
    setGroupsCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const scrollToSection = useCallback((anchor: string, sectionId: AppSectionId) => {
    setActiveSection(sectionId);
    setMobileNavOpen(false);
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  /** Intersection observer for scroll-spy (re-bind when sections mount) */
  useEffect(() => {
    if (typeof window === "undefined") return;

    let observers: IntersectionObserver[] = [];

    const bind = () => {
      observers.forEach((o) => o.disconnect());
      observers = [];

      for (const id of ALL_SECTION_IDS) {
        const item = NAV_GROUPS.flatMap((g) => g.items).find(
          (i) => i.id === id,
        );
        if (!item) continue;
        const el = document.getElementById(item.anchor);
        if (!el) continue;

        const obs = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting && entry.intersectionRatio > 0.15) {
                setActiveSection(id);
              }
            }
          },
          { rootMargin: "-15% 0px -50% 0px", threshold: [0, 0.15, 0.35] },
        );
        obs.observe(el);
        observers.push(obs);
      }
    };

    bind();
    const t = window.setTimeout(bind, 600);
    const mo = new MutationObserver(() => bind());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(t);
      mo.disconnect();
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileNavOpen,
    setMobileNavOpen,
    activeSection,
    groupsCollapsed,
    toggleGroup,
    scrollToSection,
    hydrated,
  };
}

export type LayoutState = ReturnType<typeof useLayoutState>;
