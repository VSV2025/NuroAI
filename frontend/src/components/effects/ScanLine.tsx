/** A red "intelligence scan" sweep used on analyzing/loading states. */
export function ScanLine({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}>
      <div className="absolute inset-x-0 h-24 animate-scan bg-gradient-to-b from-transparent via-crimson-bright/25 to-transparent blur-md" />
      <div className="absolute inset-x-0 top-0 h-px animate-scan bg-crimson-bright/70 shadow-[0_0_14px_rgba(255,30,30,0.8)]" />
    </div>
  );
}
