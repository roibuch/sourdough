"use client";

import { CalculatorIcon } from "@heroicons/react/24/outline";
import { heContent } from "@/lib/content";

const copy = heContent.luxury.welcome;

export function WelcomeEmptyState() {
  return (
    <div
      className="flex min-h-[min(24rem,55vh)] flex-col items-center justify-center px-6 py-16 text-center lg:min-h-[min(32rem,65vh)]"
      aria-labelledby="welcome-heading"
    >
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-muted text-accent">
        <CalculatorIcon className="h-10 w-10" strokeWidth={1.5} aria-hidden />
      </div>
      <p
        id="welcome-heading"
        className="max-w-md text-lg leading-relaxed text-text-secondary sm:text-xl"
      >
        {copy.body}
      </p>
    </div>
  );
}
