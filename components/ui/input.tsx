import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border bg-bg-surface px-4 text-sm text-fg-primary",
          "placeholder:text-fg-faint transition-all duration-[var(--duration-normal)]",
          "border-border hover:border-border-strong",
          "focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-error/50 focus:ring-error/30 focus:border-error/50",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
