import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  PlayCircle,
  Sparkles,
  Brain,
  Fingerprint,
  Languages,
  ShieldAlert,
  Code2,
  ScanSearch,
  Gauge,
  XCircle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NeuralBackground } from "@/components/effects/NeuralBackground";
import { Reveal } from "@/components/effects/Reveal";
import { CountUp } from "@/components/effects/CountUp";
import { LogoImage } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const problems = [
  { t: "Only detects text similarity", d: "Surface matching misses everything that has been reworded." },
  { t: "Cannot detect AI rewrites", d: "Generative paraphrasing slips past lexical comparison entirely." },
  { t: "Cannot verify authorship", d: "No way to confirm the person submitting actually wrote it." },
  { t: "Cannot detect idea theft", d: "Borrowed arguments with new words register as original." },
  { t: "Cannot see across languages", d: "Translate-and-submit defeats single-language indexes." },
  { t: "Limited explainability", d: "A percentage with no evidence cannot survive an appeal." },
];

const modules = [
  { icon: Brain, t: "Semantic Intelligence", d: "Meaning-level matching that survives paraphrase and restructuring." },
  { icon: Fingerprint, t: "Authorship Verification", d: "Stylometric Writing DNA confirms who actually wrote the work." },
  { icon: Languages, t: "Cross-Language Detection", d: "Catches translate-and-submit across 40+ languages." },
  { icon: ShieldAlert, t: "AI-Laundering Detection", d: "Flags text rewritten by models to evade detectors." },
  { icon: Code2, t: "Code Intelligence", d: "AST-level structural comparison beyond variable renaming." },
  { icon: Sparkles, t: "Explainable AI", d: "Every verdict ships with evidence, reasoning and confidence." },
  { icon: ScanSearch, t: "Risk Analytics", d: "Portfolio-wide trends, alerts and integrity dashboards." },
  { icon: Gauge, t: "Real-Time Engine", d: "Streaming pipeline processes documents in seconds." },
];

const stats = [
  { to: 95, suffix: "%", label: "Detection Accuracy" },
  { to: 8, suffix: "", label: "Detection Layers" },
  { to: 20, suffix: "+", label: "Intelligence Models" },
  { to: 40, suffix: "+", label: "Languages Supported" },
];

export default function Landing() {
  const nav = useNavigate();

  return (
    <div className="relative overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen pt-32">
        <NeuralBackground className="opacity-70" />
        <div className="pointer-events-none absolute inset-0 grid-faint opacity-40" />
        <div className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-crimson/20 blur-[140px]" />

        <div className="relative mx-auto max-w-5xl px-5 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-2 max-w-3xl"
          >
            <LogoImage className="mx-auto w-full max-w-[640px] rounded-2xl" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson-bright" />
              <span className="font-mono text-[11px] uppercase tracking-ultra text-silver-dim">
                Plagiarism Intelligence Platform
              </span>
            </div>

            <p className="mx-auto max-w-3xl text-balance text-lg leading-relaxed text-silver md:text-xl">
              A multi-dimensional, AI-powered platform that detects{" "}
              <span className="text-silver-bright">AI-generated, translated, conceptual,
              authorship-based and code plagiarism</span>{" "}
              through explainable intelligence.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => nav("/dashboard/analyze")}>
                Start Analysis <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="metal" onClick={() => nav("/login")}>
                Request Demo
              </Button>
              <Button size="lg" variant="ghost">
                <PlayCircle className="h-4 w-4" /> Watch Platform Overview
              </Button>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-14 font-mono text-[11px] uppercase tracking-ultra text-silver-dim/70"
          >
            Trusted by integrity offices at research universities & enterprises
          </motion.p>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="relative mx-auto max-w-7xl px-5 py-24">
        <Reveal>
          <p className="eyebrow mb-3">The gap</p>
          <h2 className="max-w-2xl font-display text-4xl font-extrabold tracking-tight text-metal">
            Why traditional plagiarism detection fails
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.05}>
              <Card className="h-full">
                <XCircle className="mb-3 h-5 w-5 text-crimson" />
                <h3 className="text-base font-semibold text-silver-bright">{p.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-silver-dim">{p.d}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SOLUTION */}
      <section id="solution" className="relative py-24">
        <div className="pointer-events-none absolute inset-0 grid-faint opacity-20" />
        <div className="relative mx-auto max-w-7xl px-5">
          <Reveal>
            <p className="eyebrow mb-3">The engine</p>
            <h2 className="max-w-2xl font-display text-4xl font-extrabold tracking-tight text-metal">
              The NuroAI intelligence engine
            </h2>
            <p className="mt-3 max-w-xl text-silver-dim">
              Eight detection layers working in concert — not a single similarity score, but a
              defensible verdict across every dimension of authenticity.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((m, i) => (
              <Reveal key={m.t} delay={i * 0.05}>
                <Card className="group h-full transition-transform duration-300 hover:-translate-y-1">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-crimson/30 bg-crimson/10 transition-colors group-hover:bg-crimson/20">
                    <m.icon className="h-5 w-5 text-crimson-bright" />
                  </div>
                  <h3 className="text-base font-semibold text-silver-bright">{m.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-silver-dim">{m.d}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section id="impact" className="relative mx-auto max-w-7xl px-5 py-24">
        <Reveal>
          <Card edge className="relative overflow-hidden p-10 md:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-crimson/20 blur-[100px]" />
            <p className="eyebrow mb-3">By the numbers</p>
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-metal">
              Intelligence at scale
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-5xl font-extrabold text-crimson-metal">
                    <CountUp to={s.to} suffix={s.suffix} />
                  </div>
                  <p className="mt-2 text-sm text-silver-dim">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-2xl border border-crimson/20 bg-gradient-to-r from-crimson/[0.08] to-transparent p-8 md:flex-row">
            <div>
              <h3 className="font-display text-2xl font-bold text-silver-bright">
                See NuroAI on your own documents
              </h3>
              <p className="mt-1 text-silver-dim">Upload a file and get a full intelligence report in seconds.</p>
            </div>
            <Button size="lg" onClick={() => nav("/dashboard/analyze")}>
              Start Analysis <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
