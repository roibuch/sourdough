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
        <h1 className="truncate font-serif text-base font-normal text-text-primary sm:text-lg">
          {title}
        </h1>
        {tagline ? (
          <p className="truncate text-[11px] text-text-muted sm:text-xs">
            {tagline}
          </p>
        ) : null}
      </div>
    </div>
  );
}
