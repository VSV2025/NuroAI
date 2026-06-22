import { cn } from "@/lib/utils";

/**
 * ShieldMark — a crisp SVG redraw of the NuroAI shield so the mark scales
 * perfectly in the navbar / sidebar / favicons. Metallic silver edge with a
 * crimson core "N", matching the 3D logo.
 */
export function ShieldMark({
  className,
  glow = true,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 116"
      className={cn("h-9 w-auto", glow && "drop-shadow-[0_0_10px_rgba(255,30,30,0.5)]", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="shieldSilver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#bdbdbd" />
          <stop offset="100%" stopColor="#4a4a4a" />
        </linearGradient>
        <linearGradient id="shieldRed" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#ff5a5a" />
          <stop offset="40%" stopColor="#ff1e1e" />
          <stop offset="100%" stopColor="#7f1414" />
        </linearGradient>
        <linearGradient id="nMetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff7a7a" />
          <stop offset="50%" stopColor="#e01313" />
          <stop offset="100%" stopColor="#5e0e0e" />
        </linearGradient>
      </defs>
      {/* Outer shield (silver bevel) */}
      <path
        d="M50 3 L94 19 V58 C94 86 73 104 50 113 C27 104 6 86 6 58 V19 Z"
        fill="url(#shieldSilver)"
      />
      {/* Inner crimson field */}
      <path
        d="M50 12 L86 25 V58 C86 81 69 96 50 104 C31 96 14 81 14 58 V25 Z"
        fill="url(#shieldRed)"
      />
      {/* Dark inset to give depth */}
      <path
        d="M50 18 L80 29 V58 C80 77 66 90 50 97 C34 90 20 77 20 58 V29 Z"
        fill="#1a0606"
        opacity="0.55"
      />
      {/* Stylized N */}
      <path
        d="M36 34 H45 L60 64 V34 H68 V82 H59 L44 52 V82 H36 Z"
        fill="url(#nMetal)"
        stroke="#ffd9d9"
        strokeOpacity="0.25"
        strokeWidth="0.6"
      />
    </svg>
  );
}

/** Wordmark — silver "Nuro" + crimson "AI", serif like the logo */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-2xl font-extrabold leading-none tracking-tight", className)}>
      <span className="text-metal">Nuro</span>
      <span className="text-crimson-metal">AI</span>
    </span>
  );
}

/** Full lockup: shield + wordmark */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <ShieldMark className="h-8" />
      <Wordmark />
    </div>
  );
}

/** The actual rendered logo image, for hero / login moments */
export function LogoImage({ className }: { className?: string }) {
  return (
    <img
      src="/nuroai-logo.jpeg"
      alt="NuroAI — Protecting Authentic Learning"
      className={cn("select-none", className)}
      draggable={false}
    />
  );
}
