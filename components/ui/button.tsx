"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-white text-black hover:bg-zinc-100 shadow-sm hover:shadow-[0_0_32px_rgba(255,255,255,0.1)]",
  secondary:
    "bg-bg-surface text-fg-primary border border-border hover:bg-bg-hover hover:border-border-strong",
  ghost: "text-fg-secondary hover:text-fg-primary hover:bg-bg-hover",
  brand: "bg-brand text-white hover:bg-brand/90 shadow-[0_0_24px_var(--brand-glow)]",
  outline:
    "border border-border text-fg-secondary hover:text-fg-primary hover:bg-bg-hover hover:border-border-strong",
  destructive: "bg-error/10 text-error border border-error/20 hover:bg-error/15",
  link: "text-brand hover:text-brand/80 underline-offset-4 hover:underline p-0 h-auto",
} as const;

const sizes = {
  xs: "h-7 px-2.5 text-xs gap-1 rounded-lg",
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
  xl: "h-12 px-6 text-[15px] gap-2.5 rounded-xl",
  icon: "h-10 w-10 p-0 rounded-xl",
  "icon-sm": "h-8 w-8 p-0 rounded-lg",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center font-medium",
        "transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]",
        "focus-ring disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = "Button";
