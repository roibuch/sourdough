import { cn } from "@/lib/cn";

interface StatHighlightProps {
  label: string;
  value: string;
  sublabel?: string;
  featured?: boolean;
  className?: string;
}

export function StatHighlight({
  label,
  value,
  sublabel,
  featured,
  className,
}: StatHighlightProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 text-center sm:p-5",
        featured
          ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-md shadow-emerald-900/10 ring-1 ring-emerald-200/60"
          : "border-stone-200 bg-stone-50/80",
        className,
      )}
    >
      <span className="block text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <strong
        className={cn(
          "mt-2 block font-serif leading-none",
          featured ? "text-3xl text-emerald-900 sm:text-4xl" : "text-xl text-stone-900",
        )}
      >
        {value}
      </strong>
      {sublabel && (
        <span className="mt-1.5 block text-xs text-stone-500">{sublabel}</span>
      )}
    </div>
  );
}
