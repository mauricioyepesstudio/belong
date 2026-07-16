import { cn } from "@/lib/utils";
import Link from "next/link";
import type { HTMLAttributes } from "react";

type LogoProps = HTMLAttributes<HTMLDivElement> & {
  href?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "text-xs tracking-[0.25em]",
  md: "text-sm tracking-[0.3em]",
  lg: "text-base tracking-[0.35em]",
};

export function Logo({ className, href = "/", size = "md", ...props }: LogoProps) {
  const content = (
    <span
      className={cn("font-semibold text-fg-primary", sizes[size], className)}
      {...props}
    >
      BELONG
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}
