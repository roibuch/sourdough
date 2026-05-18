import { SparklesIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/cn";

interface MasterBakerTipProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function MasterBakerTip({
  title = "טיפ מאסטר בייקר",
  children,
  className,
}: MasterBakerTipProps) {
  return (
    <aside
      className={cn(
        "flex gap-4 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 shadow-sm",
        className,
      )}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800"
        aria-hidden
      >
        <SparklesIcon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-serif text-sm font-semibold text-amber-900">{title}</p>
        <div className="mt-1.5 text-sm leading-relaxed text-stone-700">
          {children}
        </div>
      </div>
    </aside>
  );
}
