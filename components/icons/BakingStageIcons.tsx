import type { LifecyclePhaseId } from "@/lib/timelineLifecycle";
import { classifyStepPhase } from "@/lib/timelineLifecycle";
import { cn } from "@/lib/cn";

const stroke = 1.75;

interface IconProps {
  className?: string;
}

/** Mixing bowl — autolyse */
export function BowlIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <path
        d="M4 10c0-3.5 3.6-6 8-6s8 2.5 8 6v1H4v-1Z"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      <path
        d="M5 11v2c0 3 3.6 5.5 7 5.5s7-2.5 7-5.5v-2"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d="M8 20h8"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Levain jar — starter */
export function JarIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <path
        d="M9 3h6l1 3H8l1-3Z"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      <rect
        x="7"
        y="6"
        width="10"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth={stroke}
      />
      <path
        d="M9 12h6"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        opacity={0.6}
      />
    </svg>
  );
}

/** Thermometer — temp / DDT */
export function ThermometerIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <path
        d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Hands / fold — bulk */
export function FoldIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <path
        d="M8 11V8a2 2 0 1 1 4 0v3M12 11V7a2 2 0 1 1 4 0v6"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d="M8 14c0 2 1.8 4 4 4s4-2 4-4"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Snowflake — retard */
export function ColdIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <path
        d="M12 3v18M5.6 5.6l12.8 12.8M20.4 5.6 7.6 18.4M3 12h18"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Bread loaf — bake */
export function BreadIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <path
        d="M6 14c0-3.3 2.7-8 6-8s6 4.7 6 8v3H6v-3Z"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      <path
        d="M5 17h14"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d="M9 10c.5-1 1.2-1.5 3-1.5s2.5.5 3 1.5"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity={0.5}
      />
    </svg>
  );
}

export function StageIcon({
  phase,
  className,
}: {
  phase: LifecyclePhaseId;
  className?: string;
}) {
  switch (phase) {
    case "starter":
      return <JarIcon className={className} />;
    case "autolyse":
      return <BowlIcon className={className} />;
    case "bulk":
      return <FoldIcon className={className} />;
    case "retard":
      return <ColdIcon className={className} />;
    case "bake":
      return <BreadIcon className={className} />;
  }
}

export function StepStageIcon({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <StageIcon phase={classifyStepPhase(title)} className={className} />
  );
}
