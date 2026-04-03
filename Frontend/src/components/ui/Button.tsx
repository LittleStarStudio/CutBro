import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "outline"
  | "ghost"
  | "destructive"
  | "hero"
  | "hero-outline"
  | "gold"
  | "emerald";

type ButtonSize = "default" | "sm" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      asChild = false,
      variant = "default",
      size = "default",
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          // base
          "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95",

          // sizes
          size === "default" && "px-4 py-2 text-sm",
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "lg" && "px-6 py-3 text-base",

          // variants
          variant === "default" &&
            "bg-amber-500 text-black hover:bg-amber-500/90",

          variant === "outline" &&
            "border border-neutral-700 text-white bg-transparent hover:bg-neutral-800",

          variant === "ghost" &&
            "bg-transparent hover:bg-neutral-800 text-white",

          variant === "destructive" &&
            "bg-red-500 text-white hover:bg-red-600",

          variant === "hero" &&
            "bg-amber-500 text-black text-lg px-8 py-4",

          variant === "hero-outline" &&
            "border-2 border-amber-500 text-amber-500 bg-transparent px-8 py-4",

          variant === "gold" &&
            "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 shadow-lg shadow-amber-500/25",

          variant === "emerald" &&
            "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 shadow-lg shadow-emerald-500/25",

          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;
