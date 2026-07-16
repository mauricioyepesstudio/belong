"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { usePageLoading } from "@/hooks/use-page-loading";

type PageContentProps = {
  skeleton: ReactNode;
  children: ReactNode;
};

export function PageContent({ skeleton, children }: PageContentProps) {
  const loading = usePageLoading();

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {skeleton}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
