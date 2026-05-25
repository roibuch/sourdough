"use client";

import { heContent } from "@/lib/content";

const copy = heContent.luxury.welcome;

export function WelcomeEmptyState() {
  return (
    <div
      className="flex min-h-[min(28rem,65vh)] flex-col items-center justify-center px-6 py-12 text-center lg:min-h-[min(36rem,72vh)]"
      aria-labelledby="welcome-heading"
    >
      <svg
        viewBox="0 0 200 120"
        className="mb-10 w-full max-w-md text-accent-gold/70"
        aria-hidden
      >
        <ellipse cx="100" cy="95" rx="72" ry="14" fill="currentColor" opacity="0.12" />
        <path
          d="M48 78 Q100 18 152 78 Q130 88 100 92 Q70 88 48 78 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path
          d="M62 72 Q100 42 138 72"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.5"
        />
      </svg>
      <p className="max-w-md font-serif text-2xl font-light leading-relaxed text-text-primary sm:text-3xl">
        {copy.quote}
      </p>
      <p
        id="welcome-heading"
        className="mt-6 max-w-sm text-sm font-normal text-text-secondary"
      >
        <span className="hidden lg:inline">{copy.hint}</span>
        <span className="lg:hidden">{copy.hintMobile}</span>
      </p>
    </div>
  );
}
