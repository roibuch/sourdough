import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "alarm" | "weather";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-crust text-dough shadow-md shadow-crust/25 hover:bg-crust-dark active:bg-crust-dark",
  secondary:
    "border-2 border-warm-border bg-white text-charcoal hover:border-crust/40 hover:bg-wheat-muted/50",
  ghost:
    "border border-warm-border bg-dough/80 text-charcoal-muted hover:bg-white hover:border-wheat",
  alarm:
    "bg-orange-700 text-white shadow-md shadow-orange-900/25 hover:bg-orange-800 active:bg-orange-900",
  weather:
    "border-2 border-wheat/60 bg-gradient-to-br from-white to-wheat-muted/80 text-crust hover:border-wheat hover:shadow-sm",
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
        "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wheat focus-visible:ring-offset-2 focus-visible:ring-offset-dough",
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
