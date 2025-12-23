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
        "inline-flex items-center gap-1 rounded-full border-2 border-white/60 bg-gradient-to-r from-[#fff0c9] via-[#ffd1f3] to-[#c5f5ff] px-3 py-1 text-[10px] font-arcade uppercase tracking-[0.25em] text-[#0a1c32]",
        className
      )}
    >
      {children}
    </span>
  );
}
