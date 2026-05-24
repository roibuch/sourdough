import { SourdoughApp } from "@/components/SourdoughApp";

export default function HomePage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-[60] focus:rounded-2xl focus:bg-emerald-800 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        דלג לתוכן
      </a>
      <SourdoughApp />
    </>
  );
}
