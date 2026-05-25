import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "alarm" | "weather";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white shadow-sm hover:bg-accent-hover",
  secondary:
    "border border-border-subtle bg-surface text-text-primary shadow-sm hover:border-accent/30 hover:bg-accent-muted/40",
  ghost:
    "border border-transparent bg-transparent text-text-secondary hover:bg-stone-100 hover:text-text-primary",
  alarm:
    "bg-error text-white shadow-sm hover:bg-red-700",
  weather:
    "border border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100",
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
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-semibold motion-safe:transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
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
