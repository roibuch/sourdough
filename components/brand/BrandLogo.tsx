import Image from "next/image";
import { brandAssetPath } from "@/lib/brand";
import { cn } from "@/lib/cn";

interface BrandLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({ size = 48, className, priority = true }: BrandLogoProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full",
        "bg-dough ring-2 ring-wheat/35 shadow-sm shadow-crust/10 sm:ring-wheat/40",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src={brandAssetPath("logo.png")}
        alt=""
        width={size}
        height={size}
        className="object-contain"
        style={{ width: Math.round(size * 0.92), height: Math.round(size * 0.92) }}
        priority={priority}
      />
    </div>
  );
}
