import { motion } from "framer-motion";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Fingerprint, AlertTriangle } from "lucide-react";
import { PageHeading } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ui/score-ring";
import { writingDNA } from "@/data/mock";

const metrics = [
  { label: "Writing Rhythm", value: 41, base: 78 },
  { label: "Vocabulary Complexity", value: 92, base: 64 },
  { label: "Sentence Structure", value: 38, base: 70 },
  { label: "Writing Consistency", value: 47, base: 82 },
  { label: "Author Similarity", value: 28, base: 100 },
  { label: "Behavioral Signature", value: 35, base: 74 },
];

/** Decorative biometric "Writing DNA" fingerprint built from concentric arcs. */
function FingerprintViz() {
  const rings = Array.from({ length: 9 });
  return (
    <div className="relative grid place-items-center py-2">
      <svg viewBox="0 0 240 240" className="h-60 w-60">
        <defs>
          <radialGradient id="fp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF1E1E" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#991B1B" stopOpacity="0.2" />
          </radialGradient>
        </defs>
        {rings.map((_, i) => {
          const r = 16 + i * 12;
          const dash = 6 + i * 3;
          return (
            <motion.circle
              key={i}
              cx="120"
              cy="120"
              r={r}
              fill="none"
              stroke="url(#fp)"
              strokeWidth={1.4}
              strokeDasharray={`${dash} ${dash * 0.7}`}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1, rotate: i % 2 ? 8 : -8 }}
              transition={{ duration: 1.2, delay: i * 0.08, ease: "easeOut" }}
              style={{ transformOrigin: "120px 120px" }}
            />
          );
        })}
        <circle cx="120" cy="120" r="6" fill="#FF1E1E" className="animate-pulse-glow" />
      </svg>
      <span className="absolute bottom-0 font-mono text-[10px] uppercase tracking-ultra text-silver-dim">
        Signature ID · 0x9F3A·E1
      </span>
    </div>
  );
}

export default function Authorship() {
  return (
    <div>
      <PageHeading
        eyebrow="Stylometry"
        title="Writing DNA Analysis"
        description="A biometric fingerprint of how a person writes — compared against their own history."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        {/* Fingerprint + verdict */}
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-crimson/15 blur-[90px]" />
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-crimson-bright" />
            <p className="eyebrow">Behavioral signature</p>
          </div>
          <FingerprintViz />
          <div className="mt-4 flex items-center justify-between rounded-xl border border-crimson/30 bg-crimson/[0.06] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-crimson-bright" />
              <span className="text-sm text-silver-bright">Style deviation</span>
            </div>
            <Badge tone="red">3.4σ from baseline</Badge>
          </div>
        </Card>

        {/* Radar */}
        <Card>
          <p className="eyebrow mb-2">Writing DNA · author vs. submission</p>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={writingDNA} outerRadius="72%">
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="trait" tick={{ fill: "#9A9A9A", fontSize: 11 }} />
              <Radar name="Author baseline" dataKey="author" stroke="#D9D9D9" fill="#D9D9D9" fillOpacity={0.12} strokeWidth={2} />
              <Radar name="This submission" dataKey="sample" stroke="#FF1E1E" fill="#FF1E1E" fillOpacity={0.22} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 text-xs">
            <span className="flex items-center gap-2 text-silver-dim">
              <span className="h-2 w-2 rounded-full bg-silver" /> Author baseline
            </span>
            <span className="flex items-center gap-2 text-silver-dim">
              <span className="h-2 w-2 rounded-full bg-crimson-bright" /> This submission
            </span>
          </div>
        </Card>
      </div>

      {/* Similarity + metrics */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[auto_1fr]">
        <Card className="grid place-items-center">
          <ScoreRing value={28} label="Author Similarity" color="#FF1E1E" size={150} />
          <p className="mt-2 max-w-[200px] text-center text-xs text-silver-dim">
            Low similarity to the author's 14 prior submissions.
          </p>
        </Card>

        <Card>
          <p className="eyebrow mb-4">Signature metrics</p>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-silver">{m.label}</span>
                  <span className="font-mono text-xs text-silver-dim">
                    {m.value} <span className="text-silver-dim/50">/ {m.base} base</span>
                  </span>
                </div>
                <div className="relative">
                  <Progress value={m.value} color={Math.abs(m.value - m.base) > 25 ? "#FF1E1E" : "#22c55e"} />
                  <span
                    className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-silver/60"
                    style={{ left: `${m.base}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
