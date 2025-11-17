import { cn } from "@/lib/utils";

export function Badge({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full bg-daisy-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-daisy-700",
        className
      )}
    >
      {children}
    </span>
  );
}
