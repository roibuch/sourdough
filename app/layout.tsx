import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import Script from "next/script";
import { OpenWeatherRuntimeConfig } from "@/components/OpenWeatherRuntimeConfig";
import { BRAND, brandAssetPath } from "@/lib/brand";
import { heContent } from "@/lib/content";
import { getBasePath } from "@/lib/basePath";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heebo",
  display: "swap",
});

const frank = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-frank",
  display: "swap",
});

const basePath = getBasePath();
const appleTouchIcon = brandAssetPath("icon-512x512.png");

export const metadata: Metadata = {
  title: heContent.app.metadata.title,
  description: heContent.app.metadata.description,
  icons: {
    icon: [
      { url: brandAssetPath("logo.png"), sizes: "192x192", type: "image/png" },
      {
        url: brandAssetPath("icon-512x512.png"),
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [{ url: appleTouchIcon, sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "מחמצת",
  },
};

export const viewport: Viewport = {
  themeColor: BRAND.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${frank.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href={appleTouchIcon} />
        <meta name="theme-color" content={BRAND.themeColor} />
        <meta name="color-scheme" content="light" />
      </head>
      <body className="min-h-screen bg-background font-sans text-text-primary antialiased">
        <OpenWeatherRuntimeConfig />
        <Script src={`${basePath}/config.js`} strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
