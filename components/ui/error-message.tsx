import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import type { HTMLAttributes } from "react";

export function ErrorMessage({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error",
        className
      )}
      {...props}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
