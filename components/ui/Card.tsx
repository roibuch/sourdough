import { cn } from "@/lib/cn";

interface CardProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  /** Slightly inset nested card */
  nested?: boolean;
}

export function Card({ id, children, className, nested }: CardProps) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-sm border border-border-subtle bg-surface shadow-lg shadow-black/20",
        nested ? "p-5 sm:p-6" : "p-6 sm:p-8 md:p-10",
        className,
      )}
    >
      {children}
    </section>
  );
}
