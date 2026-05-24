"use client";

import { useReducedMotion } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";

interface MorphingValueProps {
  value: string;
  className?: string;
  /** Use spring scale pulse on change */
  emphasize?: boolean;
}

/** Split "1000 גרם" → number + suffix for smoother numeric transitions */
function parseValue(raw: string): { key: string; display: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([\d.,]+)(.*)$/);
  if (!match) return { key: trimmed, display: trimmed };
  const num = match[1].replace(/,/g, "");
  const suffix = match[2].trim();
  return {
    key: `${num}|${suffix}`,
    display: trimmed,
  };
}

export function MorphingValue({
  value,
  className,
  emphasize,
}: MorphingValueProps) {
  const reduceMotion = useReducedMotion();
  const { key, display } = parseValue(value);

  if (reduceMotion) {
    return <span className={className}>{display}</span>;
  }

  return (
    <span className={`relative inline-block tabular-nums ${className ?? ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={key}
          initial={{ opacity: 0, y: emphasize ? 10 : 6, filter: "blur(4px)" }}
          animate={{
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            scale: 1,
          }}
          exit={{ opacity: 0, y: emphasize ? -10 : -6, filter: "blur(4px)" }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 28,
            mass: 0.6,
          }}
          className="inline-block"
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
