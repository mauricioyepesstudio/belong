import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[100px] w-full resize-none rounded-xl border bg-bg-surface px-4 py-3 text-sm text-fg-primary",
      "placeholder:text-fg-faint transition-all duration-[var(--duration-normal)]",
      "border-border hover:border-border-strong",
      "focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50",
      "disabled:cursor-not-allowed disabled:opacity-50",
      error && "border-error/50 focus:ring-error/30",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
