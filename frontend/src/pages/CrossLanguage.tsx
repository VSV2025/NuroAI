import { motion } from "framer-motion";
import { ArrowRight, Languages } from "lucide-react";
import { PageHeading } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const langs = [
  { code: "ES", name: "Spanish", sim: 0.91 },
  { code: "FR", name: "French", sim: 0.62 },
  { code: "DE", name: "German", sim: 0.41 },
  { code: "ZH", name: "Chinese", sim: 0.78 },
  { code: "AR", name: "Arabic", sim: 0.33 },
];

function RelationshipGraph() {
  const cx = 110;
  const cy = 170;
  return (
    <svg viewBox="0 0 460 340" className="w-full">
      <defs>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF1E1E" />
          <stop offset="100%" stopColor="#3a0d0d" />
        </linearGradient>
      </defs>
      {langs.map((l, i) => {
        const ty = 50 + i * 60;
        const tx = 360;
        const strong = l.sim > 0.7;
        return (
          <g key={l.code}>
            <motion.path
              d={`M ${cx + 36} ${cy} C 240 ${cy}, 240 ${ty}, ${tx - 30} ${ty}`}
              fill="none"
              stroke={strong ? "url(#edge)" : "rgba(217,217,217,0.18)"}
              strokeWidth={strong ? 2 + l.sim * 2 : 1.2}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: i * 0.12 }}
            />
            <motion.g
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <circle cx={tx} cy={ty} r={18} fill="#0B0B0B" stroke={strong ? "#FF1E1E" : "rgba(255,255,255,0.15)"} strokeWidth={1.5} />
              <text x={tx} y={ty + 4} textAnchor="middle" fontSize="11" fontFamily="monospace" fill={strong ? "#FF5A5A" : "#9A9A9A"}>
                {l.code}
              </text>
              <text x={tx + 26} y={ty + 4} fontSize="11" fill="#9A9A9A">
                {(l.sim * 100).toFixed(0)}%
              </text>
            </motion.g>
          </g>
        );
      })}
      {/* Source node */}
      <circle cx={cx} cy={cy} r={36} fill="url(#edge)" className="animate-pulse-glow" />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff" fontFamily="serif">
        EN
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" fontSize="9" fill="#ffd9d9">
        SOURCE
      </text>
    </svg>
  );
}

export default function CrossLanguage() {
  return (
    <div>
      <PageHeading
        eyebrow="Multilingual"
        title="Cross-Language Intelligence"
        description="Detects translate-and-submit plagiarism by comparing meaning across languages."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <p className="eyebrow mb-3">Language pair</p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="grid h-14 w-14 place-items-center rounded-xl border border-crimson/30 bg-crimson/10 font-mono text-lg text-crimson-bright">
                EN
              </div>
              <p className="mt-1.5 text-xs text-silver-dim">Source</p>
            </div>
            <ArrowRight className="h-5 w-5 text-silver-dim" />
            <div className="text-center">
              <div className="grid h-14 w-14 place-items-center rounded-xl border border-white/10 bg-white/[0.03] font-mono text-lg text-silver">
                ES
              </div>
              <p className="mt-1.5 text-xs text-silver-dim">Matched origin</p>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow mb-3">Translation similarity</p>
          <p className="font-display text-4xl font-extrabold text-crimson-metal">88%</p>
          <Progress value={88} className="mt-3" />
          <p className="mt-3 text-xs text-silver-dim">Surface alignment after machine back-translation.</p>
        </Card>

        <Card>
          <p className="eyebrow mb-3">Semantic similarity</p>
          <p className="font-display text-4xl font-extrabold text-crimson-metal">91%</p>
          <Progress value={91} className="mt-3" />
          <p className="mt-3 text-xs text-silver-dim">Embedding cosine similarity, language-normalized.</p>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <Languages className="h-5 w-5 text-crimson-bright" />
            <p className="eyebrow">Cross-language mapping</p>
          </div>
          <RelationshipGraph />
        </Card>

        <Card>
          <p className="eyebrow mb-4">Closest source languages</p>
          <div className="space-y-4">
            {langs
              .slice()
              .sort((a, b) => b.sim - a.sim)
              .map((l, i) => (
                <motion.div
                  key={l.code}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-silver">
                      <span className="font-mono text-xs text-silver-dim">{l.code}</span>
                      {l.name}
                    </span>
                    {l.sim > 0.7 && <Badge tone="red">Match</Badge>}
                  </div>
                  <Progress value={l.sim * 100} color={l.sim > 0.7 ? "#FF1E1E" : "#7a1d1d"} />
                </motion.div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
