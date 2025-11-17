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
        "rounded-[28px] border border-white/40 bg-white/90 p-5 shadow-card backdrop-blur-lg",
        className
      )}
    >
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
    <h3 className={cn("text-lg font-semibold text-gray-900", className)}>
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
    <p className={cn("text-sm text-gray-600", className)}>{children}</p>
  );
}
