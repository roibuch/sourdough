import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { OpenWeatherRuntimeConfig } from "@/components/OpenWeatherRuntimeConfig";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
});

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
    <html lang="he" dir="rtl" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">
        <OpenWeatherRuntimeConfig />
        {children}
      </body>
    </html>
  );
}
