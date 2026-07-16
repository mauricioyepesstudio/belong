import { PageHeader } from "@/systems/layout";
import type { ReactNode } from "react";

type FeatureScreenProps = {
  label?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

export function FeatureScreen({
  label,
  title,
  description,
  action,
  toolbar,
  children,
}: FeatureScreenProps) {
  return (
    <div className="space-y-6">
      <PageHeader label={label} title={title} description={description} action={action} />
      {toolbar}
      {children}
    </div>
  );
}
