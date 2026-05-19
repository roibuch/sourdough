import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import Script from "next/script";
import { OpenWeatherRuntimeConfig } from "@/components/OpenWeatherRuntimeConfig";
import { getBasePath } from "@/lib/basePath";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

const frank = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-frank",
  display: "swap",
});

const basePath = getBasePath();

export const metadata: Metadata = {
  title: "Sourdough Master | מחשבון ומדריך מחמצת",
  description:
    "מחשבון בצק מחמצת, תערובות קמח, הידרציה אמיתית ומדריך אפייה — בעברית, מותאם לכולם.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#065f46",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${frank.variable}`}>
      <body className="font-sans antialiased">
        <OpenWeatherRuntimeConfig />
        <Script src={`${basePath}/config.js`} strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
