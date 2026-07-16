import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder = "Search...",
  className,
  "aria-label": ariaLabel = "Search",
}: SearchFieldProps) {
  return (
    <div className={cn("relative w-full sm:w-64", className)}>
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint"
        aria-hidden
      />
      <Input
        className="pl-10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
    </div>
  );
}
