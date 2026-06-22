import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  UploadCloud,
  FileText,
  ScanText,
  Brain,
  Languages,
  Fingerprint,
  ShieldAlert,
  Code2,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { PageHeading } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanLine } from "@/components/effects/ScanLine";

const steps = [
  { icon: ScanText, label: "OCR Extraction", detail: "Reading text layers & scanned pages" },
  { icon: Brain, label: "Semantic Analysis", detail: "Embedding meaning beyond words" },
  { icon: Languages, label: "Translation Analysis", detail: "Back-translating across 40+ languages" },
  { icon: Fingerprint, label: "Authorship Verification", detail: "Comparing stylometric Writing DNA" },
  { icon: ShieldAlert, label: "AI Detection", detail: "Scoring perplexity & burstiness" },
  { icon: Code2, label: "Code Intelligence", detail: "Building & matching AST structures" },
  { icon: Sparkles, label: "Explainable AI", detail: "Attaching evidence & reasoning" },
  { icon: FileText, label: "Final Report", detail: "Compiling the intelligence verdict" },
];

export default function DocumentAnalysis() {
  const nav = useNavigate();
  const [file, setFile] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (!running) return;
    if (active >= steps.length) {
      const t = setTimeout(() => nav("/dashboard/results"), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), 720);
    return () => clearTimeout(t);
  }, [running, active, nav]);

  const start = () => {
    if (!file) setFile("thesis_final_v3.docx");
    setRunning(true);
    setActive(0);
  };

  return (
    <div>
      <PageHeading
        eyebrow="Document Analysis"
        title="Run an intelligence scan"
        description="Drop a document and NuroAI runs all eight detection layers in a single pass."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Upload */}
        <Card className="relative overflow-hidden">
          {running && <ScanLine />}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              setFile(e.dataTransfer.files?.[0]?.name ?? "uploaded_document.pdf");
            }}
            className={`relative grid place-items-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
              dragging ? "border-crimson bg-crimson/5" : "border-white/10"
            }`}
          >
            <motion.div
              animate={{ y: dragging ? -4 : 0 }}
              className="grid h-16 w-16 place-items-center rounded-2xl border border-crimson/30 bg-crimson/10"
            >
              <UploadCloud className="h-7 w-7 text-crimson-bright" />
            </motion.div>
            <p className="mt-4 text-base font-medium text-silver-bright">
              {file ? file : "Drag & drop a document"}
            </p>
            <p className="mt-1 text-sm text-silver-dim">or click to browse</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["PDF", "DOCX", "TXT", "ZIP"].map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            <input
              type="file"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)}
            />
          </div>

          <Button className="mt-5 w-full" size="lg" onClick={start} disabled={running}>
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                Run Intelligence Scan <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </Card>

        {/* Pipeline */}
        <Card>
          <p className="eyebrow mb-4">Analysis pipeline</p>
          <ol className="space-y-1">
            {steps.map((s, i) => {
              const done = running && i < active;
              const isActive = running && i === active;
              return (
                <li
                  key={s.label}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    isActive ? "bg-crimson/10" : ""
                  }`}
                >
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors ${
                      done
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : isActive
                        ? "border-crimson/40 bg-crimson/15"
                        : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {done ? (
                        <motion.span key="d" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle2 className="h-[18px] w-[18px] text-emerald-400" />
                        </motion.span>
                      ) : isActive ? (
                        <Loader2 className="h-[18px] w-[18px] animate-spin text-crimson-bright" />
                      ) : (
                        <s.icon className="h-[18px] w-[18px] text-silver-dim" />
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        done || isActive ? "text-silver-bright" : "text-silver-dim"
                      }`}
                    >
                      {s.label}
                    </p>
                    <p className="truncate text-xs text-silver-dim">{s.detail}</p>
                  </div>
                  {isActive && (
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-crimson-bright">
                      running
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}
