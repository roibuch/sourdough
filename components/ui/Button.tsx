import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "alarm" | "weather";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-gold text-background hover:bg-accent-gold-hover uppercase tracking-wide font-medium",
  secondary:
    "border border-border-subtle bg-surface-elevated text-text-primary hover:border-accent-gold/40",
  ghost:
    "border border-border-subtle bg-transparent text-text-secondary hover:border-accent-gold/50 hover:text-text-primary",
  alarm:
    "bg-error/90 text-text-primary hover:bg-error",
  weather:
    "border border-border-subtle bg-surface text-accent-gold hover:border-accent-gold/50",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-sm px-5 py-3 text-base motion-safe:transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
