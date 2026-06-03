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
        "relative shrink-0 overflow-hidden rounded-full bg-dough",
        "ring-2 ring-wheat/45 shadow-sm shadow-crust/15",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={brandAssetPath("logo.png")}
        alt="לוגו מאסטר מחמצת - מחשבון בצק"
        width={size}
        height={size}
        sizes={`${size}px`}
        className="h-full w-full object-contain object-center"
        priority={priority}
      />
    </div>
  );
}
