"use client";

import { useLayoutState } from "@/hooks/useLayoutState";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const layout = useLayoutState();

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <AppHeader layout={layout} />

      <div className="relative flex flex-1">
        {/* Desktop sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 start-0 z-40 hidden pt-14 sm:pt-16 lg:block",
            layout.sidebarCollapsed ? "w-[4.25rem]" : "w-72",
            "transition-[width] duration-300 ease-out",
          )}
        >
          <AppSidebar layout={layout} className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-4rem)]" />
        </div>

        {/* Mobile drawer */}
        {layout.mobileNavOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm lg:hidden"
              aria-label="סגור תפריט"
              onClick={() => layout.setMobileNavOpen(false)}
            />
            <div className="fixed inset-y-0 start-0 z-50 w-72 pt-14 sm:pt-16 lg:hidden">
              <AppSidebar layout={layout} mobile className="h-full" />
            </div>
          </>
        )}

        <main
          id="main"
          className={cn(
            "flex-1 transition-[margin] duration-300 ease-out",
            "px-4 py-6 sm:px-6 sm:py-8",
            "lg:ms-[4.25rem]",
            !layout.sidebarCollapsed && "lg:ms-72",
          )}
        >
          <div className="mx-auto max-w-3xl space-y-8 sm:space-y-10">
            {children}
          </div>

          <footer className="mx-auto mt-12 max-w-3xl border-t border-stone-200/80 pt-8 text-center text-sm text-stone-500">
            {heContent.app.footer}
          </footer>
        </main>
      </div>
    </div>
  );
}
