import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  className,
}: SectionHeaderProps) {
  return (
    <header className={cn("mb-6 sm:mb-8", className)}>
      <div className="flex items-start gap-3 sm:gap-4">
        {icon && (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wheat-muted text-crust ring-1 ring-wheat/50"
            aria-hidden
          >
            {icon}
          </span>
        )}
        <div>
          <h2 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-prose text-base leading-relaxed text-charcoal-muted">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
