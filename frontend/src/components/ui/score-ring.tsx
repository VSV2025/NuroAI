import { motion } from "framer-motion";

export function ScoreRing({
  value,
  label,
  color = "#FF1E1E",
  size = 132,
}: {
  value: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            whileInView={{ strokeDashoffset: c - (c * value) / 100 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 8px ${color}aa)` }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-3xl font-extrabold text-silver-bright">{value}</span>
        </div>
      </div>
      <p className="mt-2 text-xs uppercase tracking-widest text-silver-dim">{label}</p>
    </div>
  );
}
