import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "alarm" | "weather";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-800 text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-900 active:bg-emerald-950",
  secondary:
    "border-2 border-stone-200 bg-white text-stone-800 hover:border-emerald-700/40 hover:bg-stone-50",
  ghost:
    "border border-stone-200 bg-stone-50/80 text-stone-700 hover:bg-white hover:border-stone-300",
  alarm:
    "bg-orange-700 text-white shadow-md shadow-orange-900/25 hover:bg-orange-800 active:bg-orange-900",
  weather:
    "border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/80 text-emerald-900 hover:border-emerald-400 hover:shadow-sm",
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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
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
