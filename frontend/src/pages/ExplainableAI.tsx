import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Quote, Link2 } from "lucide-react";
import { PageHeading } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { explainableSections } from "@/data/mock";
import { scoreColor } from "@/lib/utils";

export default function ExplainableAI() {
  const [active, setActive] = useState(explainableSections[0].id);
  const selected = explainableSections.find((s) => s.id === active)!;

  return (
    <div>
      <PageHeading
        eyebrow="Transparency"
        title="Explainable Intelligence Report"
        description="Every verdict is traceable. Select a passage to see why it was flagged."
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Document */}
        <Card>
          <p className="eyebrow mb-4">Annotated document · thesis_final_v3.docx</p>
          <div className="space-y-3 text-[15px] leading-relaxed">
            {explainableSections.map((s) => {
              const isActive = s.id === active;
              const flagged = s.risk >= 45;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`block w-full rounded-lg px-3 py-2 text-left transition-all ${
                    isActive ? "ring-1 ring-crimson/60" : ""
                  }`}
                  style={{
                    background: flagged
                      ? `rgba(255,30,30,${0.06 + (s.risk / 100) * 0.12})`
                      : "transparent",
                  }}
                >
                  <span className={flagged ? "text-silver-bright" : "text-silver-dim"}>{s.text}</span>
                  {flagged && (
                    <span className="ml-2 align-middle">
                      <Badge tone={s.risk >= 75 ? "red" : "amber"}>
                        {s.type} · {s.risk}
                      </Badge>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Reasoning panel */}
        <motion.div key={selected.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="sticky top-20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-crimson-bright" />
              <Badge tone={selected.risk >= 75 ? "red" : selected.risk >= 45 ? "amber" : "green"}>
                {selected.type}
              </Badge>
            </div>

            <div className="mt-4">
              <p className="eyebrow mb-1.5">Suspicion level</p>
              <div className="flex items-center gap-3">
                <Progress value={selected.risk} color={scoreColor(selected.risk)} />
                <span className="font-mono text-sm font-semibold" style={{ color: scoreColor(selected.risk) }}>
                  {selected.risk}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <p className="eyebrow mb-1.5">Matched passage</p>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <Quote className="mb-1 h-4 w-4 text-silver-dim" />
                <p className="text-sm italic text-silver">{selected.text}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="eyebrow mb-1.5">Reason for detection</p>
              <p className="text-sm leading-relaxed text-silver-dim">{selected.reason}</p>
            </div>

            <div className="mt-5">
              <p className="eyebrow mb-2">Evidence sources</p>
              {selected.sources.length ? (
                <div className="flex flex-wrap gap-2">
                  {selected.sources.map((src) => (
                    <span
                      key={src}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-xs text-silver-dim"
                    >
                      <Link2 className="h-3 w-3" /> {src}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-400">No external matches — consistent with original work.</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
