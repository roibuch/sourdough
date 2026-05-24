import type { MetadataRoute } from "next";
import { BRAND, brandAssetPath } from "@/lib/brand";
import { getBasePath } from "@/lib/basePath";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const base = getBasePath();
  const startUrl = base ? `${base}/` : "/";

  return {
    name: "Sourdough Master | מחשבון מחמצת",
    short_name: "מחמצת",
    description:
      "מחשבון בצק מחמצת, מדריך שלבים ולוח זמנים הפוך — עובד גם ללא אינטרנט.",
    start_url: startUrl,
    scope: startUrl,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: BRAND.backgroundColor,
    theme_color: BRAND.themeColor,
    lang: "he",
    dir: "rtl",
    icons: [
      {
        src: brandAssetPath("icon-512x512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandAssetPath("icon-512x512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
