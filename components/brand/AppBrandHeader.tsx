import { BrandLogo } from "@/components/brand/BrandLogo";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

interface AppBrandHeaderProps {
  title?: string;
  tagline?: string;
  className?: string;
  logoSize?: number;
}

export function AppBrandHeader({
  title = heContent.app.brandName,
  tagline,
  className,
  logoSize = 48,
}: AppBrandHeaderProps) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-3", className)}>
      <BrandLogo size={logoSize} />
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-serif text-lg font-semibold text-charcoal sm:text-xl">
          {title}
        </h1>
        {tagline ? (
          <p className="hidden truncate text-xs text-charcoal-muted sm:block">{tagline}</p>
        ) : null}
      </div>
    </div>
  );
}
