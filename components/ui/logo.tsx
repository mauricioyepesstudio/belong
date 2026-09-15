import { cn } from "@/lib/utils";
import Image from "next/image";
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

const markSizes = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function Logo({ className, href = "/", size = "md", ...props }: LogoProps) {
  const mark = markSizes[size];
  const content = (
    <span
      className={cn("inline-flex items-center gap-2 font-semibold text-fg-primary", sizes[size], className)}
      {...props}
    >
      <Image src="/brand/mark.png" alt="" width={mark} height={mark} className="shrink-0" priority />
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
