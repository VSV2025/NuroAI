import { cn } from "@/lib/utils";

export function Progress({
  value,
  color = "#FF1E1E",
  className,
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          boxShadow: `0 0 12px ${color}88`,
        }}
      />
    </div>
  );
}
