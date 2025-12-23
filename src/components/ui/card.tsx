import { cn } from "@/lib/utils";

export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pixel-card relative overflow-hidden border-none bg-white/95 p-6 text-[#0b1230] shadow-arcade",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen" />
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "font-arcade text-base uppercase tracking-[0.25em] text-[#052047]",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-[#2a3353]/80", className)}>{children}</p>
  );
}
