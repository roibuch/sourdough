import { SourdoughApp } from "@/components/SourdoughApp";
import { SparklesIcon } from "@heroicons/react/24/outline";

export default function HomePage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 pb-16 sm:px-6 sm:py-10 lg:max-w-3xl lg:px-8">
      <a
        href="#main"
        className="absolute -top-24 right-4 z-50 rounded-2xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg focus:top-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        דלג לתוכן
      </a>

      <header className="mb-10 text-center sm:mb-12">
        <span
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80"
          aria-hidden
        >
          <SparklesIcon className="h-7 w-7" strokeWidth={1.5} />
        </span>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
          מחשבון ומדריך מחמצת
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-stone-600 sm:text-lg">
          חישוב בצק, תכנון לפי מזג אוויר, בחירת מועד אפייה מוכן ומדריך שלבים —
          בלי לנחש שעות, עם תוכנית מלאה.
        </p>
      </header>

      <main id="main">
        <SourdoughApp />
      </main>

      <footer className="mt-12 border-t border-stone-200/80 pt-8 text-center text-sm text-stone-500">
        Sourdough Master — המתכון נשמר ב־localStorage ובקישור לשיתוף.
      </footer>
    </div>
  );
}
