import { motion } from "framer-motion";
import { Code2, GitCompare } from "lucide-react";
import { PageHeading } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { codeBlocks } from "@/data/mock";

const metrics = [
  { label: "Code Similarity", value: 27 },
  { label: "Logic Similarity", value: 96 },
  { label: "AST Match", value: 94 },
  { label: "Structure Analysis", value: 91 },
];

function CodePane({ title, code, tone }: { title: string; code: string; tone: "left" | "right" }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-ink-0/60">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <span className="font-mono text-xs text-silver-dim">{title}</span>
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className={`h-2.5 w-2.5 rounded-full ${tone === "right" ? "bg-crimson" : "bg-white/10"}`} />
        </span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-silver">
        {code.split("\n").map((line, i) => (
          <div key={i} className="flex gap-4">
            <span className="select-none text-silver-dim/50">{String(i + 1).padStart(2, "0")}</span>
            <code className={tone === "right" && i >= 2 ? "text-crimson-bright/90" : ""}>{line}</code>
          </div>
        ))}
      </pre>
    </div>
  );
}

export default function CodeIntelligence() {
  return (
    <div>
      <PageHeading
        eyebrow="Source Code"
        title="Code Intelligence"
        description="Structural comparison that sees through renamed variables and reordered logic."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <p className="eyebrow">{m.label}</p>
              <p
                className="mt-2 font-display text-3xl font-extrabold"
                style={{ color: m.value >= 75 ? "#FF1E1E" : "#22c55e" }}
              >
                {m.value}%
              </p>
              <Progress value={m.value} color={m.value >= 75 ? "#FF1E1E" : "#22c55e"} className="mt-3" />
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="mt-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-crimson-bright" />
            <p className="eyebrow">Visual code comparison</p>
          </div>
          <Badge tone="red">Variable renaming detected</Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <CodePane title="submission.py" code={codeBlocks.left} tone="left" />
          <CodePane title="public_repo · sort_utils.py" code={codeBlocks.right} tone="right" />
        </div>
        <p className="mt-4 rounded-xl border border-crimson/20 bg-crimson/[0.05] p-4 text-sm text-silver-dim">
          <span className="text-silver-bright">Verdict:</span> identifiers were renamed
          (<span className="font-mono text-crimson-bright">a→x, b→y, i→p, j→q</span>) but the abstract
          syntax tree and control flow are identical. Lexical similarity is low; structural similarity is 94%.
        </p>
      </Card>

      <Card className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <Code2 className="h-5 w-5 text-crimson-bright" />
          <p className="eyebrow">AST node alignment</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {["FunctionDef", "While loop", "If / Else", "Return", "List append", "Slice concat"].map((n, i) => (
            <div key={n} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
              <span className="font-mono text-xs text-silver">{n}</span>
              <Badge tone={i === 1 || i === 5 ? "red" : "amber"}>{i === 1 || i === 5 ? "exact" : "near"}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
