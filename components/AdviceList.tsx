import { adviceClass } from "@/lib/flour";
import type { FlourAdvice } from "@/lib/types";

export function AdviceList({ items }: { items: FlourAdvice[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4 grid gap-3">
      {items.map((item, i) => (
        <p
          key={i}
          className={`m-0 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${adviceClass(item.type)}`}
        >
          {item.text}
        </p>
      ))}
    </div>
  );
}
