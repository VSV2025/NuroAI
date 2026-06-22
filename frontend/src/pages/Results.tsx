import { motion } from "framer-motion";
import { AlertTriangle, FileText, Download } from "lucide-react";
import { PageHeading } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ui/score-ring";
import { detections } from "@/data/mock";
import { scoreColor } from "@/lib/utils";

export default function Results() {
  return (
    <div>
      <PageHeading
        eyebrow="Intelligence Report"
        title="thesis_final_v3.docx"
        description="Generated in 4.2s across 8 detection layers · 12,480 words analyzed."
        action={
          <div className="flex gap-2">
            <Button variant="metal">
              <FileText className="h-4 w-4" /> View Evidence
            </Button>
            <Button>
              <Download className="h-4 w-4" /> Export PDF
            </Button>
          </div>
        }
      />

      {/* Top summary */}
      <Card className="overflow-hidden">
        <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex flex-wrap justify-center gap-8 md:gap-10">
            <ScoreRing value={31} label="Authenticity" color="#f59e0b" />
            <ScoreRing value={74} label="Risk Score" color="#FF1E1E" />
            <ScoreRing value={92} label="Confidence" color="#38bdf8" />
          </div>
          <div className="rounded-2xl border border-crimson/30 bg-crimson/[0.06] p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-crimson-bright" />
              <Badge tone="red">Threat Level · High</Badge>
            </div>
            <h3 className="mt-3 font-display text-2xl font-bold text-silver-bright">
              Likely AI-laundered with authorship mismatch
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-silver-dim">
              The dominant signal is generative paraphrasing across sections 2–4, combined with a
              writing style that diverges sharply from this author's prior submissions. Direct and
              code overlap are minor. We recommend an authorship interview before grading.
            </p>
          </div>
        </div>
      </Card>

      {/* Detection breakdown */}
      <h2 className="mb-4 mt-8 font-display text-xl font-bold text-metal">Detection Breakdown</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {detections.map((d, i) => (
          <motion.div
            key={d.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-silver-bright">{d.label}</h3>
                <span className="font-display text-2xl font-extrabold" style={{ color: scoreColor(d.score) }}>
                  {d.score}
                </span>
              </div>
              <Progress value={d.score} color={scoreColor(d.score)} className="mt-3" />

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="eyebrow mb-1">Evidence</dt>
                  <dd className="text-silver">{d.evidence}</dd>
                </div>
                <div>
                  <dt className="eyebrow mb-1">Reasoning</dt>
                  <dd className="text-silver-dim">{d.reasoning}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                <span className="text-xs text-silver-dim">Model confidence</span>
                <span className="font-mono text-sm font-semibold text-silver-bright">{d.confidence}%</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
