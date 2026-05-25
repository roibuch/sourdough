import { cn } from "@/lib/cn";

export function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border border-stone-200/80 bg-stone-100/80",
        className ?? "min-h-[12rem]",
      )}
      aria-hidden
    />
  );
}
