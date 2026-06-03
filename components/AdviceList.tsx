import { adviceClass } from "@/lib/flour";
import type { FlourAdvice } from "@/lib/types";
import { cn } from "@/lib/cn";

export function AdviceList({
  items,
  className,
}: {
  items: FlourAdvice[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div className={cn("mt-4 grid gap-3", className)}>
      {items.map((item, i) => (
        <p
          key={i}
          className={`m-0 rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${adviceClass(item.type)}`}
        >
          {item.text}
        </p>
      ))}
    </div>
  );
}
