import { cn } from "@/lib/cn";

interface CardProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  nested?: boolean;
}

export function Card({ id, children, className, nested }: CardProps) {
  return (
    <section
      id={id}
      className={cn(
        "app-card",
        nested ? "p-5 sm:p-6" : "p-6 sm:p-8",
        className,
      )}
    >
      {children}
    </section>
  );
}
