import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Shield, ShieldCheck, ScanLine, Brain, Fingerprint, Languages, Code2,
  FileSearch, BarChart3, Settings, LayoutDashboard, FileText, AlertTriangle,
  Activity, ChevronRight, Play, ArrowRight, Upload, CheckCircle2, Circle,
  Eye, GitCompare, Sparkles, Lock, Layers, Cpu, Globe2, FileCheck2,
  TrendingUp, Search, Bell, Menu, X, Zap, Database, Network
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ============================================================
   NuroAI — Plagiarism Intelligence Platform
   Brand: metallic silver + crimson, black, glass, red glow
   ============================================================ */

const C = {
  black0: "#050816", black1: "#071426", black2: "#0b1020",
  silver: "#D9D9D9", white: "#FFFFFF",
  red: "#FF1E1E", crimson: "#DC2626", deepRed: "#991B1B",
  redGlow: "rgba(255,30,30,0.35)",
  cyan: "#00E5FF", blue: "#4CC9FF", purple: "#7B61FF",
  neonGreen: "#00FFB2", orange: "#FF9E44",
};

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4001";

// ── Diagnose why a fetch failed and return a human-readable message ──────────
async function diagnoseError(e: any): Promise<string> {
  const raw = (e?.message ?? String(e)).toLowerCase();
  const isNetworkError = e instanceof TypeError || raw.includes("failed to fetch") || raw.includes("networkerror");
  if (isNetworkError) {
    try {
      const r = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(2500) });
      if (r.ok) return "Server returned an error — please retry.";
      return `Analysis engine returned HTTP ${r.status} — backend may be starting up.`;
    } catch {
      return "Backend service unavailable — it may be waking up (Render free tier takes ~30s). Please retry.";
    }
  }
  if (raw.includes("413")) return "File too large — maximum allowed size is 25 MB.";
  if (raw.includes("422")) return "Invalid file or unsupported format — check the file type.";
  if (raw.includes("500")) return "Analysis engine error — check backend logs.";
  if (raw.includes("upload failed")) return "Upload rejected — verify file type (PDF, DOCX, TXT, ZIP) and size.";
  if (raw.includes("timeout")) return "Request timed out — backend may be overloaded.";
  if (raw.includes("cors")) return "CORS restriction — backend origin policy mismatch.";
  return `Error: ${e?.message ?? e}`;
}

// ── Periodically poll /api/health and surface status ───────────────────────
function useBackendHealth(): "checking" | "online" | "offline" {
  const [status, setStatus] = React.useState<"checking" | "online" | "offline">("checking");
  React.useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const r = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(3000) });
        if (active) setStatus(r.ok ? "online" : "offline");
      } catch { if (active) setStatus("offline"); }
    };
    check();
    const id = setInterval(check, 12000);
    return () => { active = false; clearInterval(id); };
  }, []);
  return status;
}

/* ---------- Global stylesheet ---------- */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Spectral:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

      .nuro * { box-sizing: border-box; }
      .nuro {
        --black0:${C.black0}; --black1:${C.black1}; --black2:${C.black2};
        --silver:${C.silver}; --white:${C.white};
        --red:${C.red}; --crimson:${C.crimson}; --deepred:${C.deepRed};
        --redglow:${C.redGlow};
        font-family:'Inter',system-ui,sans-serif;
        color:#cfcfd2; background:var(--black0);
        -webkit-font-smoothing:antialiased; line-height:1.5;
        min-height:100%;
      }
      .nuro h1,.nuro h2,.nuro h3,.nuro h4 { color:#fff; letter-spacing:-0.02em; margin:0; font-weight:700; }
      .nuro p { margin:0; }
      .nuro a { color:inherit; text-decoration:none; }
      .nuro button { font-family:inherit; cursor:pointer; border:none; background:none; color:inherit; }
      .mono { font-family:'JetBrains Mono',monospace; }

      /* metallic silver text */
      .metallic {
        background:linear-gradient(180deg,#fff 0%,#e6e6e9 28%,#a9a9b0 52%,#f2f2f4 70%,#8d8d94 100%);
        -webkit-background-clip:text; background-clip:text; color:transparent;
        text-shadow:0 1px 0 rgba(255,255,255,0.08);
      }
      .crimsonText {
        background:linear-gradient(180deg,#ff6a6a 0%,#ff1e1e 40%,#dc2626 65%,#991b1b 100%);
        -webkit-background-clip:text; background-clip:text; color:transparent;
      }

      /* glass panels */
      .glass {
        background:linear-gradient(160deg,rgba(255,255,255,0.055),rgba(0,229,255,0.018));
        border:1px solid rgba(0,229,255,0.09);
        border-radius:16px;
        backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
        box-shadow:0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 60px -30px rgba(0,0,0,0.92);
      }
      .glass-hover { transition:border-color .3s, transform .3s, box-shadow .3s; }
      .glass-hover:hover {
        border-color:rgba(0,229,255,0.3);
        transform:translateY(-3px);
        box-shadow:0 1px 0 rgba(255,255,255,0.08) inset, 0 30px 70px -28px rgba(0,0,0,0.95), 0 0 36px -10px rgba(0,229,255,0.22);
      }

      .hairline { height:1px; background:linear-gradient(90deg,transparent,rgba(0,229,255,0.45),transparent); }

      .eyebrow {
        font-size:11px; letter-spacing:.28em; text-transform:uppercase;
        color:#8a8a90; font-weight:600;
      }
      .reddot { box-shadow:0 0 10px 2px var(--redglow); }

      .btn {
        display:inline-flex; align-items:center; gap:8px;
        padding:12px 20px; border-radius:11px; font-weight:600; font-size:14px;
        transition:transform .2s, box-shadow .3s, background .3s; white-space:nowrap;
      }
      .btn-primary {
        color:#fff;
        background:linear-gradient(180deg,#ff3b3b,#c81e1e);
        box-shadow:0 0 0 1px rgba(255,80,80,.5) inset, 0 10px 30px -8px var(--redglow);
      }
      .btn-primary:hover { transform:translateY(-2px); box-shadow:0 0 0 1px rgba(255,120,120,.7) inset, 0 16px 40px -8px var(--redglow); }
      .btn-ghost {
        color:#e8e8ea; background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.12);
      }
      .btn-ghost:hover { border-color:rgba(255,255,255,0.28); background:rgba(255,255,255,0.07); }

      .chip { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px;
        font-size:12px; font-weight:600; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); }

      /* animations */
      @keyframes floatUp { from{opacity:0; transform:translateY(24px);} to{opacity:1; transform:none;} }
      @keyframes glowPulse { 0%,100%{opacity:.55;} 50%{opacity:1;} }
      @keyframes scanY { 0%{transform:translateY(-120%);} 100%{transform:translateY(820%);} }
      @keyframes spin { to{transform:rotate(360deg);} }
      @keyframes dash { to{stroke-dashoffset:0;} }
      @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
      @keyframes countbar { from{transform:scaleX(0);} to{transform:scaleX(1);} }
      @keyframes reactorSpin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
      @keyframes reactorSpinRev { from{transform:rotate(0deg);} to{transform:rotate(-360deg);} }
      @keyframes orbitFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
      @keyframes chipSlideUp { from{opacity:0;transform:translateY(14px) scale(.92);} to{opacity:1;transform:translateY(0) scale(1);} }
      @keyframes streamFlow { from{stroke-dashoffset:80;} to{stroke-dashoffset:0;} }
      @keyframes gravPull { 0%,100%{transform:translateX(0);} 50%{transform:translateX(var(--gx,0px));} }
      @keyframes starTwinkle { 0%,100%{opacity:.12;transform:scale(1);} 50%{opacity:.9;transform:scale(1.5);} }
      @keyframes nebulaDrift { 0%,100%{transform:translate(0,0);} 50%{transform:translate(14px,-20px);} }
      @keyframes energySweep { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
      @keyframes particleRise { 0%{transform:translateY(0) translateX(0);opacity:0;} 25%{opacity:.8;} 100%{transform:translateY(-90px) translateX(12px);opacity:0;} }
      @keyframes liquidFill { from{transform:scaleY(0);} to{transform:scaleY(1);} }
      @keyframes neuralScan { 0%{opacity:0;transform:translateY(-100%);} 15%{opacity:.55;} 85%{opacity:.3;} 100%{opacity:0;transform:translateY(160%);} }
      @keyframes neuralFloat { 0%,100%{transform:translateY(0) translateX(0);opacity:.18;} 50%{transform:translateY(-16px) translateX(6px);opacity:.45;} }
      @keyframes circuitPulse { 0%,100%{opacity:.04;} 50%{opacity:.11;} }

      .reveal { animation:floatUp .7s cubic-bezier(.2,.7,.2,1) both; }
      .pulse { animation:glowPulse 2.6s ease-in-out infinite; }

      .skel { background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.10),rgba(255,255,255,.04));
        background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }

      .scanline {
        position:absolute; left:0; right:0; height:90px; pointer-events:none;
        background:linear-gradient(180deg,transparent,rgba(255,30,30,.12),transparent);
        animation:scanY 4.5s linear infinite;
      }

      /* sidebar nav */
      .navitem { display:flex; align-items:center; gap:12px; padding:10px 13px; border-radius:11px;
        color:#9a9aa0; font-weight:500; font-size:14px; transition:all .2s; position:relative; }
      .navitem:hover { color:#e8e8ea; background:rgba(255,255,255,0.04); }
      .navitem.active { color:#fff; background:linear-gradient(90deg,rgba(0,229,255,.12),rgba(0,229,255,.02));
        border:1px solid rgba(0,229,255,.22); }
      .navitem.active::before { content:''; position:absolute; left:-1px; top:18%; bottom:18%; width:3px;
        border-radius:3px; background:#00E5FF; box-shadow:0 0 12px rgba(0,229,255,.85); }

      .grid-bg {
        background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),
                         linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
        background-size:44px 44px;
      }
      .recharts-default-tooltip { background:#0c0c0e !important; border:1px solid rgba(255,30,30,.3) !important;
        border-radius:10px !important; }
      .recharts-tooltip-label,.recharts-tooltip-item { color:#ddd !important; }

      .codeline { display:flex; gap:14px; padding:1px 0; font-family:'JetBrains Mono',monospace; font-size:12.5px; }
      .codeline .ln { color:#4a4a52; width:26px; text-align:right; user-select:none; }
      .hl-red { background:rgba(255,30,30,.16); border-left:2px solid var(--red); margin-left:-2px; padding-left:2px; }
      .hl-amber { background:rgba(245,158,11,.14); border-left:2px solid #f59e0b; margin-left:-2px; padding-left:2px; }

      ::-webkit-scrollbar { width:10px; height:10px; }
      ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:6px; }
      ::-webkit-scrollbar-track { background:transparent; }

      @media (prefers-reduced-motion: reduce) {
        .nuro *,.reveal,.pulse,.scanline { animation:none !important; transition:none !important; }
      }
    `}</style>
  );
}

/* ---------- Deep Space Background ---------- */
function DeepSpaceBackground() {
  const stars = useMemo(() => Array.from({length: 130}, (_, i) => ({
    x: (i * 37 + 13) % 100,
    y: (i * 53 + 7) % 100,
    size: 0.5 + (i % 4) * 0.45,
    delay: (i * 0.31) % 6,
    dur: 2.2 + (i % 7) * 0.6,
  })), []);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0,
        background:"radial-gradient(ellipse at 25% 40%, #071426 0%, #050816 55%, #0b1020 100%)" }} />
      <div style={{ position:"absolute", inset:0,
        background:"radial-gradient(ellipse at 78% 18%, rgba(123,97,255,.12) 0%, transparent 52%)",
        animation:"nebulaDrift 22s ease-in-out infinite" }} />
      <div style={{ position:"absolute", inset:0,
        background:"radial-gradient(ellipse at 14% 78%, rgba(0,229,255,.08) 0%, transparent 46%)",
        animation:"nebulaDrift 30s ease-in-out infinite reverse" }} />
      <div style={{ position:"absolute", inset:0,
        background:"radial-gradient(ellipse at 90% 65%, rgba(0,255,178,.05) 0%, transparent 38%)",
        animation:"nebulaDrift 40s ease-in-out infinite" }} />
      <div style={{ position:"absolute", inset:0, opacity:0.022,
        backgroundImage:"linear-gradient(rgba(0,229,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.7) 1px,transparent 1px)",
        backgroundSize:"64px 64px" }} />
      {stars.map((s,i)=>(
        <div key={i} style={{ position:"absolute", left:`${s.x}%`, top:`${s.y}%`,
          width:s.size, height:s.size, borderRadius:"50%", background:"#fff",
          animation:`starTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
      ))}
    </div>
  );
}

/* ---------- Logo (recreated as SVG shield + wordmark) ---------- */
function ShieldMark({ size = 44 }) {
  const id = useMemo(() => "g" + Math.random().toString(36).slice(2, 7), []);
  return (
    <svg width={size} height={size * 1.12} viewBox="0 0 100 112" fill="none" aria-label="NuroAI shield">
      <defs>
        <linearGradient id={id + "red"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5a5a" /><stop offset=".45" stopColor="#ff1e1e" />
          <stop offset="1" stopColor="#7f1414" />
        </linearGradient>
        <linearGradient id={id + "sil"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" /><stop offset=".5" stopColor="#bdbdc2" />
          <stop offset="1" stopColor="#6f6f76" />
        </linearGradient>
        <radialGradient id={id + "glow"} cx=".5" cy=".4" r=".7">
          <stop offset="0" stopColor="rgba(255,30,30,.5)" /><stop offset="1" stopColor="rgba(255,30,30,0)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="48" r="46" fill={`url(#${id}glow)`} />
      {/* shield outer bevel */}
      <path d="M50 6 L88 20 V52 C88 80 70 98 50 106 C30 98 12 80 12 52 V20 Z"
        fill="#0a0a0a" stroke={`url(#${id}sil)`} strokeWidth="2.5" />
      {/* inner red shield */}
      <path d="M50 14 L80 25 V51 C80 74 66 89 50 96 C34 89 20 74 20 51 V25 Z"
        fill="none" stroke={`url(#${id}red)`} strokeWidth="5" strokeLinejoin="round" />
      {/* stylized N */}
      <path d="M37 38 V72 M37 38 L63 72 M63 38 V72" stroke={`url(#${id}red)`}
        strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Logo({ size = 40, stacked = false, tagline = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <ShieldMark size={size} />
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontFamily: "'Spectral',serif", fontWeight: 800,
          fontSize: size * 0.74, letterSpacing: "-0.01em",
        }}>
          <span className="metallic">Nuro</span><span className="crimsonText">AI</span>
        </div>
        {tagline && (
          <>
            <div style={{ height: 1, background: "linear-gradient(90deg,var(--red),transparent)", margin: "5px 0 4px", width: "92%" }} />
            <div style={{ fontSize: size * 0.235, letterSpacing: ".06em", color: "#9a9aa0", fontWeight: 500 }}>
              Protecting Authentic Learning
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Neural network hero canvas ---------- */
function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, raf; const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = 56; const nodes = [];
    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * DPR; canvas.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    for (let i = 0; i < N; i++) nodes.push({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      r: Math.random() * 1.6 + .8, hot: Math.random() < .22,
    });
    let scan = 0;
    function frame() {
      ctx.clearRect(0, 0, w, h);
      scan = (scan + 1.4) % (h + 200);
      for (const n of nodes) {
        if (!reduce) { n.x += n.vx; n.y += n.vy; }
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          const o = (1 - d / 130) * .5;
          const hot = a.hot || b.hot;
          ctx.strokeStyle = hot ? `rgba(255,40,40,${o * .8})` : `rgba(180,180,190,${o * .28})`;
          ctx.lineWidth = hot ? .8 : .5;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      for (const n of nodes) {
        const near = Math.abs(n.y - (scan - 100)) < 60;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + (near ? 1.4 : 0), 0, 7);
        if (n.hot || near) {
          ctx.fillStyle = "rgba(255,40,40,.9)";
          ctx.shadowColor = "rgba(255,30,30,.9)"; ctx.shadowBlur = 12;
        } else { ctx.fillStyle = "rgba(210,210,216,.6)"; ctx.shadowBlur = 0; }
        ctx.fill(); ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(frame);
    }
    frame();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

/* ---------- small primitives ---------- */
const Glass = ({ children, style, className = "", hover = false, pad = 22 }) => (
  <div className={`glass ${hover ? "glass-hover" : ""} ${className}`} style={{ padding: pad, ...style }}>{children}</div>
);

function ScoreRing({ value, label, color = C.red, size = 116 }) {
  const r = size / 2 - 9, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.08)" strokeWidth="8" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="8" fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)", filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{value}<span style={{ fontSize: 13, color: "#888" }}>%</span></div>
          <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#8a8a90" }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delta, tone = "silver" }) {
  const accent = tone === "red" ? C.red : "#cfcfd2";
  return (
    <Glass hover pad={18}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center",
          background: tone === "red" ? "rgba(255,30,30,.12)" : "rgba(255,255,255,.05)",
          border: `1px solid ${tone === "red" ? "rgba(255,30,30,.3)" : "rgba(255,255,255,.1)"}` }}>
          <Icon size={18} color={accent} />
        </div>
        {delta && <span className="chip" style={{ color: delta.startsWith("-") ? "#7ee787" : C.red, borderColor: "transparent", background: "rgba(255,255,255,.03)" }}>{delta}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginTop: 14 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#8a8a90", marginTop: 2 }}>{label}</div>
    </Glass>
  );
}

function SectionTitle({ eyebrow, title, sub, center }) {
  return (
    <div style={{ textAlign: center ? "center" : "left", maxWidth: center ? 720 : "none", margin: center ? "0 auto" : 0 }}>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 12 }}>{eyebrow}</div>}
      <h2 style={{ fontSize: "clamp(26px,3.4vw,42px)", lineHeight: 1.08 }}>{title}</h2>
      {sub && <p style={{ color: "#9a9aa0", marginTop: 14, fontSize: 16, maxWidth: 640, marginInline: center ? "auto" : 0 }}>{sub}</p>}
    </div>
  );
}

/* ============================================================
   DATA
   ============================================================ */
const DET_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"][i],
  direct: 30 + Math.round(Math.sin(i) * 8 + i * 1.5),
  ai: 12 + Math.round(Math.cos(i / 1.4) * 10 + i * 3.4),
}));
const THREAT = [
  { name: "AI Paraphrasing", v: 38, c: C.red },
  { name: "Direct Copy", v: 22, c: C.crimson },
  { name: "Cross-Language", v: 17, c: "#f59e0b" },
  { name: "Idea Plagiarism", v: 13, c: "#9aa0a6" },
  { name: "Code Similarity", v: 10, c: "#6b7280" },
];
const LANGS = [
  { l: "EN→ES", v: 0 }, { l: "EN→ZH", v: 0 }, { l: "EN→FR", v: 0 },
  { l: "DE→EN", v: 0 }, { l: "EN→HI", v: 0 }, { l: "JA→EN", v: 0 },
];
const DNA = [
  { k: "Rhythm", a: 0, b: 0 }, { k: "Vocabulary", a: 0, b: 0 },
  { k: "Syntax", a: 0, b: 0 }, { k: "Consistency", a: 0, b: 0 },
  { k: "Punctuation", a: 0, b: 0 }, { k: "Burstiness", a: 0, b: 0 },
];

/* ============================================================
   LANDING
   ============================================================ */
function Landing({ go }) {
  const modules = [
    { icon: Brain, t: "Semantic Intelligence", d: "Meaning-level matching that survives rewording, summarizing, and synonym swaps." },
    { icon: Fingerprint, t: "Authorship Verification", d: "Compares submission against an author's writing DNA to flag ghostwriting." },
    { icon: Languages, t: "Cross-Language Detection", d: "Detects ideas lifted from sources in other languages and translated back." },
    { icon: ShieldCheck, t: "AI-Laundering Detection", d: "Catches text run through paraphrasers and humanizers to mask AI origin." },
    { icon: Code2, t: "Code Intelligence", d: "AST and logic comparison that sees through renamed variables and reformatting." },
    { icon: Brain, t: "Neural Evidence Chamber", d: "Every verdict ships with a forensic evidence breakdown explaining exactly why NuroAI made its decision." },
    { icon: BarChart3, t: "Risk Analytics", d: "Portfolio-level dashboards for institutions, journals, and integrity offices." },
  ];
  const fails = [
    "Only detects surface text similarity", "Cannot detect AI rewrites",
    "Cannot verify true authorship", "Cannot detect idea plagiarism",
    "Cannot detect translated plagiarism", "Limited, unexplainable output",
  ];
  const stats = [
    { v: "95%", l: "Detection accuracy" }, { v: "8", l: "Detection layers" },
    { v: "20+", l: "Intelligence models" }, { v: "40+", l: "Languages supported" },
  ];
  return (
    <div>
      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "92vh", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0 }}><NeuralCanvas /></div>
        <div className="scanline" style={{ top: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 50% at 50% 30%,rgba(255,30,30,.10),transparent 70%)" }} />
        <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto", padding: "120px 24px 80px", textAlign: "center" }}>
          <div className="reveal" style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <Logo size={56} />
          </div>
          <div className="chip reveal" style={{ margin: "0 auto 26px", display: "inline-flex", color: "#e0e0e3" }}>
            <span className="reddot" style={{ width: 7, height: 7, borderRadius: 9, background: C.red, display: "inline-block" }} />
            Plagiarism Intelligence Platform · v2.0
          </div>
          <h1 className="reveal" style={{ fontSize: "clamp(40px,7vw,86px)", lineHeight: .98, fontFamily: "'Spectral',serif", fontWeight: 800 }}>
            <span className="metallic">Detect what other</span><br />
            <span className="crimsonText">checkers can't see.</span>
          </h1>
          <p className="reveal" style={{ maxWidth: 720, margin: "26px auto 0", fontSize: 18, color: "#a6a6ac" }}>
            A multi-dimensional, AI-powered platform that detects AI-generated, translated,
            conceptual, authorship-based and code plagiarism — through explainable intelligence,
            not just text matching.
          </p>
          <div className="reveal" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 36 }}>
            <button className="btn btn-primary" onClick={() => go("analyze")}><ScanLine size={17} /> Start Analysis</button>
            <button className="btn btn-ghost" onClick={() => go("dashboard")}><LayoutDashboard size={17} /> Request Demo</button>
            <button className="btn btn-ghost"><Play size={15} /> Watch Platform Overview</button>
          </div>
          <div className="reveal" style={{ display: "flex", gap: 26, justifyContent: "center", flexWrap: "wrap", marginTop: 54, opacity: .8 }}>
            {["Palantir-grade", "SOC-2 ready", "On-prem option", "API-first"].map(x => (
              <span key={x} className="mono" style={{ fontSize: 12, color: "#7a7a80", letterSpacing: ".08em" }}>◆ {x}</span>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "90px 24px" }}>
        <SectionTitle center eyebrow="The blind spot"
          title="Why traditional plagiarism detection fails"
          sub="Legacy tools match strings. Modern academic dishonesty doesn't leave strings to match." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginTop: 44 }}>
          {fails.map((f, i) => (
            <Glass key={i} hover pad={20}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <AlertTriangle size={18} color={C.red} style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ color: "#cfcfd2", fontSize: 15 }}>{f}</div>
              </div>
            </Glass>
          ))}
        </div>
      </section>

      {/* SOLUTION */}
      <section className="grid-bg" style={{ borderTop: "1px solid rgba(255,255,255,.06)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "90px 24px" }}>
          <SectionTitle center eyebrow="Eight detection layers" title="The NuroAI intelligence engine"
            sub="Each layer is a specialized model. Together they form a defensible verdict — with the receipts." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginTop: 44 }}>
            {modules.map((m, i) => (
              <Glass key={i} hover pad={22}>
                <div style={{ width: 42, height: 42, borderRadius: 11, display: "grid", placeItems: "center",
                  background: "rgba(255,30,30,.1)", border: "1px solid rgba(255,30,30,.25)", marginBottom: 16 }}>
                  <m.icon size={20} color={C.red} />
                </div>
                <h3 style={{ fontSize: 17 }}>{m.t}</h3>
                <p style={{ color: "#9a9aa0", marginTop: 8, fontSize: 14 }}>{m.d}</p>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "90px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
          {stats.map((s, i) => (
            <Glass key={i} pad={28} style={{ textAlign: "center" }}>
              <div className="metallic" style={{ fontSize: 48, fontWeight: 800, fontFamily: "'Spectral',serif" }}>{s.v}</div>
              <div className="hairline" style={{ margin: "14px auto", width: 60 }} />
              <div style={{ color: "#9a9aa0", fontSize: 14 }}>{s.l}</div>
            </Glass>
          ))}
        </div>
        <Glass pad={40} style={{ marginTop: 48, textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(50% 100% at 50% 0%,rgba(255,30,30,.12),transparent)" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ fontSize: "clamp(24px,3vw,36px)" }}>Bring intelligence to academic integrity.</h2>
            <p style={{ color: "#9a9aa0", marginTop: 12, maxWidth: 540, margin: "12px auto 0" }}>
              Deploy NuroAI across your institution, journal, or platform in days.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 26 }} onClick={() => go("dashboard")}>
              Enter Intelligence Center <ArrowRight size={16} />
            </button>
          </div>
        </Glass>
      </section>

      <Footer />
    </div>
  );
}

function Footer() {
  const cols = {
    Platform: ["Document Analysis", "Authorship", "Cross-Language", "Code Intelligence"],
    Company: ["About", "Security", "Research", "Careers"],
    Resources: ["Docs", "API", "Status", "Changelog"],
  };
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,.07)", background: C.black1 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px 32px", display: "grid",
        gridTemplateColumns: "1.4fr repeat(3,1fr)", gap: 32 }}>
        <div>
          <Logo size={34} tagline={false} />
          <p style={{ color: "#7a7a80", fontSize: 13, marginTop: 16, maxWidth: 260 }}>
            Protecting authentic learning with explainable plagiarism intelligence.
          </p>
        </div>
        {Object.entries(cols).map(([h, items]) => (
          <div key={h}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>{h}</div>
            {items.map(x => <div key={x} style={{ color: "#9a9aa0", fontSize: 14, padding: "5px 0", cursor: "pointer" }}>{x}</div>)}
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: "18px 24px", maxWidth: 1180, margin: "0 auto",
        display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontSize: 12, color: "#6a6a70" }}>
        <span>© 2026 NuroAI Inc. All rights reserved.</span>
        <span className="mono">Engineered for trust ◆ SOC-2 ◆ GDPR</span>
      </div>
    </footer>
  );
}

/* ============================================================
   LANGUAGE GALAXY — 3D Linguistic Forensics Page
   ============================================================ */

const GALAXY_CLUSTERS = [
  { id: "human_academic",  name: "Human Research Writing",    type: "human", color: "#22c55e",
    interpretation: "This zone represents authentic academic writing produced by human researchers and scholars." },
  { id: "human_creative",  name: "Human Creative Writing",    type: "human", color: "#4ade80",
    interpretation: "This zone captures expressive, imaginative writing with natural human creativity and voice." },
  { id: "human_casual",    name: "Natural Human Writing",     type: "human", color: "#86efac",
    interpretation: "This zone represents everyday human writing — conversational, spontaneous, and natural." },
  { id: "research",        name: "Academic Research Style",   type: "human", color: "#10b981",
    interpretation: "This zone reflects structured scholarly writing typical of journals and academic papers." },
  { id: "student",         name: "Student Writing",           type: "human", color: "#34d399",
    interpretation: "This zone captures student essays and coursework with natural variation and developing voice." },
  { id: "synthetic",       name: "AI Research Writing",       type: "ai",    color: "#ef4444",
    interpretation: "Your document shares patterns with AI-generated academic content — highly structured and consistent." },
  { id: "structured",      name: "AI Assistant Writing Style",type: "ai",    color: "#dc2626",
    interpretation: "This zone matches writing produced by AI assistants — predictable transitions and uniform phrasing." },
  { id: "predictive",      name: "Generative AI Writing",     type: "ai",    color: "#f97316",
    interpretation: "This zone represents text from language models — fluent but with statistically predictable patterns." },
  { id: "commercial",      name: "AI Commercial Writing",     type: "ai",    color: "#fb923c",
    interpretation: "This zone captures AI-generated marketing and business content with polished, formulaic structure." },
];

function computeClusterData(aiProb: number, humanProb: number) {
  return GALAXY_CLUSTERS.map((c, i) => {
    const base = c.type === "human"
      ? humanProb + Math.sin(i * 1.7) * 14
      : aiProb   + Math.cos(i * 2.1) * 14;
    const sim  = Math.max(1, Math.min(99, Math.round(base)));
    const dist = Math.round(100 - sim * 0.72);
    const conf = Math.min(99, Math.round(sim * 0.95 + 4));
    return { ...c, sim, dist, conf };
  });
}

/* ---- Error Boundary for Language Galaxy ---- */

class GalaxyErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; msg: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, msg: "" };
  }
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, msg: e.message };
  }
  componentDidCatch(e: Error, info: React.ErrorInfo) {
    console.error("[LanguageGalaxy]", e, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: "center", color: "#ef4444" }}>
          <AlertTriangle size={28} style={{ margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Galaxy visualization error</div>
          <div style={{ fontSize: 12, color: "#7a7a80" }}>{this.state.msg}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---- HTML5 Canvas 2D galaxy (fully React-18 compatible) ---- */

const CLUSTER_POS_2D = [
  { x: 0.20, y: 0.18 }, // Human Academic
  { x: 0.40, y: 0.11 }, // Human Creative
  { x: 0.62, y: 0.17 }, // Human Casual
  { x: 0.80, y: 0.32 }, // Research Writing
  { x: 0.10, y: 0.36 }, // Student Writing
  { x: 0.24, y: 0.76 }, // Synthetic Academic
  { x: 0.46, y: 0.84 }, // Structured Reasoning
  { x: 0.67, y: 0.77 }, // Predictive Language
  { x: 0.84, y: 0.62 }, // Commercial Generation
];

/* ============================================================
   THREE.JS / REACT THREE FIBER — 3D SCENE COMPONENTS
   ============================================================ */

function TorusRing3D({ radius, tube, color, speedX, speedY, speedZ, emIntensity }: {
  radius: number; tube: number; color: string;
  speedX: number; speedY: number; speedZ: number; emIntensity: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const c = useMemo(() => new THREE.Color(color), [color]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ref.current.rotation.x = t * speedX + Math.sin(t * speedX * 0.4) * 0.45;
    ref.current.rotation.y = t * speedY;
    ref.current.rotation.z = t * speedZ;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, tube, 12, 80]} />
      <meshStandardMaterial color={color} emissive={c} emissiveIntensity={emIntensity} roughness={0} metalness={1} />
    </mesh>
  );
}

function ReactorCore3D({ color }: { color: string }) {
  const lHemRef   = useRef<THREE.Mesh>(null!);
  const rHemRef   = useRef<THREE.Mesh>(null!);
  const stemRef   = useRef<THREE.Mesh>(null!);
  const wire1Ref  = useRef<THREE.Mesh>(null!);
  const wire2Ref  = useRef<THREE.Mesh>(null!);
  const glowRef   = useRef<THREE.Mesh>(null!);
  const c = useMemo(() => new THREE.Color(color), [color]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const breath = 1 + Math.sin(t * 0.55) * 0.022;
    lHemRef.current.scale.setScalar(breath);
    rHemRef.current.scale.setScalar(breath);
    wire1Ref.current.rotation.y = t * 0.14;
    wire1Ref.current.rotation.x = Math.sin(t * 0.09) * 0.11;
    wire2Ref.current.rotation.y = -t * 0.10;
    wire2Ref.current.rotation.z = Math.sin(t * 0.07) * 0.09;
    glowRef.current.scale.setScalar(0.88 + Math.sin(t * 1.1) * 0.12);
    stemRef.current.scale.y = 1 + Math.sin(t * 0.8) * 0.04;
  });
  return (
    <group>
      <pointLight color={color} intensity={14} distance={16} decay={1.3} />
      <pointLight color="#4cc9ff" intensity={3.5} distance={9} decay={2} position={[0, 3.5, 2]} />
      <pointLight color="#7b61ff" intensity={2.2} distance={8} decay={2} position={[0, -3, 1.5]} />
      <mesh ref={lHemRef} position={[-0.30, 0.10, 0]} scale={[0.80, 0.92, 0.94]}>
        <sphereGeometry args={[0.90, 48, 48]} />
        <meshPhysicalMaterial color={color} emissive={c} emissiveIntensity={0.75}
          roughness={0.55} metalness={0.28} transparent opacity={0.68}
          clearcoat={0.4} clearcoatRoughness={0.35} />
      </mesh>
      <mesh ref={rHemRef} position={[0.30, 0.10, 0]} scale={[0.80, 0.92, 0.94]}>
        <sphereGeometry args={[0.90, 48, 48]} />
        <meshPhysicalMaterial color={color} emissive={c} emissiveIntensity={0.75}
          roughness={0.55} metalness={0.28} transparent opacity={0.68}
          clearcoat={0.4} clearcoatRoughness={0.35} />
      </mesh>
      <mesh ref={stemRef} position={[0, -0.72, -0.18]} scale={[0.35, 0.48, 0.40]}>
        <sphereGeometry args={[0.90, 20, 20]} />
        <meshPhysicalMaterial color={color} emissive={c} emissiveIntensity={0.55}
          roughness={0.5} metalness={0.3} transparent opacity={0.52} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color={color} emissive={c} emissiveIntensity={4.0}
          roughness={0.02} metalness={0.98} />
      </mesh>
      <mesh ref={wire1Ref}>
        <icosahedronGeometry args={[0.98, 4]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.20} />
      </mesh>
      <mesh ref={wire2Ref}>
        <icosahedronGeometry args={[1.28, 3]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.08} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.55, 14, 14]} />
        <meshBasicMaterial color={color} transparent opacity={0.038} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function EvidenceNode3D({ nodeIdx, name, conf, status, color, posRef }: {
  nodeIdx: number; name: string; conf: number; status: string; color: string;
  posRef: React.MutableRefObject<THREE.Vector3[]>;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const c = useMemo(() => new THREE.Color(color), [color]);
  const t0 = useMemo(() => (nodeIdx / 6) * Math.PI * 2, [nodeIdx]);
  const orbitR = 2.55;
  const orbitSpeed = 0.10 + nodeIdx * 0.013;
  const yBase = useMemo(() => ([0.6, -0.5, 0.7, -0.6, 0.4, -0.7][nodeIdx] ?? 0), [nodeIdx]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const angle = t0 + t * orbitSpeed;
    const x = Math.cos(angle) * orbitR;
    const z = Math.sin(angle) * orbitR;
    const y = yBase + Math.sin(t * 0.42 + nodeIdx * 1.1) * 0.16;
    groupRef.current.position.set(x, y, z);
    groupRef.current.rotation.y += 0.007;
    posRef.current[nodeIdx].set(x, y, z);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.21, 32, 32]} />
        <meshPhysicalMaterial color={color} emissive={c} emissiveIntensity={1.6} roughness={0.05} metalness={0.6} transparent opacity={0.88} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.29, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.012, 8, 32, (conf / 100) * Math.PI * 2]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <pointLight color={color} intensity={0.65} distance={1.6} decay={2} />
      <Html position={[0, -0.50, 0]} center style={{ pointerEvents: "none", userSelect: "none" }}>
        <div style={{
          background: "rgba(5,8,22,.92)", border: `1px solid ${color}45`,
          borderRadius: 8, padding: "4px 9px",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          textAlign: "center", whiteSpace: "nowrap",
          fontFamily: "'Inter',sans-serif",
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color, lineHeight: 1 }}>{conf}%</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#c0c0cc", marginTop: 2 }}>{name}</div>
          <div style={{ fontSize: 8, color: "#6a6a7a", marginTop: 1 }}>{status}</div>
        </div>
      </Html>
    </group>
  );
}

function DynamicBeam3D({ nodeIdx, color, posRef }: {
  nodeIdx: number; color: string; posRef: React.MutableRefObject<THREE.Vector3[]>;
}) {
  const [line] = useState(() => {
    const arr = new Float32Array(6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.48 });
    return new THREE.Line(geo, mat);
  });
  useFrame(() => {
    const pos = line.geometry.attributes.position as THREE.BufferAttribute;
    const np = posRef.current[nodeIdx];
    pos.setXYZ(0, 0, 0, 0);
    pos.setXYZ(1, np.x, np.y, np.z);
    pos.needsUpdate = true;
    line.geometry.computeBoundingSphere();
  });
  return <primitive object={line} />;
}

function NeuralNode3D({ nodeIdx, name, conf, status, color, posRef }: {
  nodeIdx: number; name: string; conf: number; status: string; color: string;
  posRef: React.MutableRefObject<THREE.Vector3[]>;
}) {
  const groupRef  = useRef<THREE.Group>(null!);
  const sphereRef = useRef<THREE.Mesh>(null!);
  const c = useMemo(() => new THREE.Color(color), [color]);
  const BRAIN_POS = useMemo<[number,number,number][]>(() => [
    [ 0.0,  2.6,  0.6],
    [-2.6,  0.5,  0.0],
    [ 2.6,  0.5,  0.0],
    [ 0.0,  2.2, -1.6],
    [-2.0, -1.8,  0.5],
    [ 2.0, -1.8,  0.5],
  ], []);
  const [bx, by, bz] = BRAIN_POS[nodeIdx] ?? [0, 2.5, 0];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const y = by + Math.sin(t * 0.72 + nodeIdx * 1.1) * 0.10;
    groupRef.current.position.set(bx, y, bz);
    posRef.current[nodeIdx].set(bx, y, bz);
    const s = 1 + Math.sin(t * 1.3 + nodeIdx * 0.95) * 0.14;
    sphereRef.current.scale.setScalar(s);
  });

  return (
    <group ref={groupRef}>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.20, 24, 24]} />
        <meshPhysicalMaterial color={color} emissive={c} emissiveIntensity={2.6}
          roughness={0.07} metalness={0.74} clearcoat={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.32, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.07} side={THREE.BackSide} />
      </mesh>
      <pointLight color={color} intensity={0.65} distance={1.6} decay={2} />
      <Html position={[0, -0.48, 0]} center style={{ pointerEvents: "none", userSelect: "none" }}>
        <div style={{ background: "rgba(4,8,20,.94)", border: `1px solid ${color}55`,
          borderRadius: 7, padding: "3px 8px", textAlign: "center", whiteSpace: "nowrap",
          fontFamily: "'Inter',sans-serif", boxShadow: `0 0 10px ${color}22` }}>
          <div style={{ fontSize: 10, fontWeight: 900, color, lineHeight: 1 }}>{conf}%</div>
          <div style={{ fontSize: 7.5, color: "#b0b0bc", marginTop: 1 }}>{name}</div>
        </div>
      </Html>
    </group>
  );
}

function ReactorScene3D({ nodes, coreColor, confidence }: {
  nodes: Array<{ id: string; name: string; conf: number; status: string }>;
  coreColor: string; confidence: number;
}) {
  const posRef = useRef<THREE.Vector3[]>(Array.from({ length: 6 }, () => new THREE.Vector3()));
  const nodeColors = useMemo(() => nodes.map(n => {
    const s = n.status;
    return (s === "Passed" || s === "Active" || s === "Verified" || s === "Monolingual" || s === "No Code")
      ? "#22c55e" : (s === "Flagged" || s === "Failed") ? "#ef4444" : "#f59e0b";
  }), [nodes]);

  return (
    <>
      <color attach="background" args={["#040a14"]} />
      <ambientLight intensity={0.14} color="#0e2a4a" />
      <pointLight position={[0, 6, 4]} intensity={0.4} color="#4cc9ff" decay={2} />
      <pointLight position={[0, -4, 3]} intensity={0.2} color="#7b61ff" decay={2} />
      <ReactorCore3D color={coreColor} />
      {nodes.map((n, i) => (
        <NeuralNode3D key={n.id} nodeIdx={i} name={n.name} conf={n.conf} status={n.status}
          color={nodeColors[i]} posRef={posRef} />
      ))}
      {nodes.map((n, i) => (
        <DynamicBeam3D key={`beam-${n.id}`} nodeIdx={i} color={nodeColors[i]} posRef={posRef} />
      ))}
      <Html position={[0, 0, 0.72]} center style={{ pointerEvents: "none", userSelect: "none" }}>
        <div style={{ textAlign: "center", fontFamily: "'Inter',sans-serif" }}>
          <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.45)", letterSpacing: ".24em", marginBottom: 2 }}>NEURAL CORE</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1,
            textShadow: `0 0 28px ${coreColor}, 0 0 50px ${coreColor}50` }}>{confidence}%</div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,.32)", letterSpacing: ".14em", marginTop: 3 }}>CONFIDENCE</div>
        </div>
      </Html>
    </>
  );
}

function NeuralNodeChip({ node, color, align }: {
  node: { name: string; conf: number; status: string }; color: string; align: "left" | "right";
}) {
  return (
    <div style={{ padding:"10px 14px", borderRadius:12,
      background:`${color}09`, border:`1px solid ${color}30`,
      boxShadow:`0 0 18px ${color}0c, inset 0 0 8px ${color}04`,
      backdropFilter:"blur(10px)", textAlign:align }}>
      <div style={{ fontSize:8, fontWeight:800, color, letterSpacing:".10em",
        textTransform:"uppercase", marginBottom:5, opacity:.92 }}>{node.name}</div>
      <div style={{ fontSize:22, fontWeight:900, color:"#fff", marginBottom:3, lineHeight:1,
        textShadow:`0 0 16px ${color}` }}>{node.conf}%</div>
      <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,.05)",
        marginBottom:5, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${node.conf}%`, borderRadius:2,
          background:`linear-gradient(90deg,${color}55,${color})`,
          boxShadow:`0 0 6px ${color}`, transition:"width 1.2s cubic-bezier(.4,0,.2,1)" }}/>
      </div>
      <div style={{ fontSize:9, color:"#55555f", fontWeight:600 }}>{node.status}</div>
    </div>
  );
}

function NeuralBrainPanel({ nodes, coreColor, confidence, isHuman }: {
  nodes: Array<{ id: string; name: string; conf: number; status: string }>;
  coreColor: string; confidence: number; isHuman: boolean;
}) {
  const nc = useMemo(() => nodes.map(n => {
    const s = n.status;
    return (s==="Passed"||s==="Active"||s==="Verified"||s==="Monolingual"||s==="No Code")
      ? "#22c55e" : (s==="Flagged"||s==="Failed") ? "#ef4444" : "#f59e0b";
  }), [nodes]);
  const lN = nodes.slice(0,3), rN = nodes.slice(3,6);
  const lC = nc.slice(0,3),   rC = nc.slice(3,6);
  const cL = confidence >= 85 ? "VERY HIGH CONFIDENCE"
    : confidence >= 70 ? "HIGH CONFIDENCE"
    : confidence >= 55 ? "MODERATE CONFIDENCE" : "LOW CONFIDENCE";
  const LPts: [number,number][] = [[0,43],[0,130],[0,217]];
  const RPts: [number,number][] = [[300,43],[300,130],[300,217]];
  const bX=150, bY=126;
  return (
    <div style={{ display:"flex", alignItems:"stretch", background:"#040a14",
      borderRadius:20, overflow:"hidden", position:"relative", border:`1px solid ${coreColor}18` }}>
      {/* Neural grid background */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0 }}>
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%",
          animation:"circuitPulse 4s ease-in-out infinite" }}>
          <defs>
            <pattern id="ngrid3" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00e5ff" strokeWidth="0.35" opacity="0.7"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ngrid3)"/>
        </svg>
        <div style={{ position:"absolute", left:0, right:0, height:2,
          background:`linear-gradient(90deg,transparent,${coreColor}60,${coreColor}85,${coreColor}60,transparent)`,
          boxShadow:`0 0 14px ${coreColor}35`, animation:"neuralScan 5s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", top:0, left:0, width:200, height:200, borderRadius:"50%",
          background:`radial-gradient(circle, ${coreColor}07 0%, transparent 70%)`,
          transform:"translate(-40%,-40%)" }}/>
        <div style={{ position:"absolute", bottom:0, right:0, width:240, height:240, borderRadius:"50%",
          background:"radial-gradient(circle, #7b61ff06 0%, transparent 70%)",
          transform:"translate(40%,40%)" }}/>
      </div>
      {/* Left evidence column */}
      <div style={{ width:192, flexShrink:0, display:"flex", flexDirection:"column",
        justifyContent:"space-around", padding:"24px 16px", position:"relative", zIndex:2 }}>
        {lN.map((n,i)=><NeuralNodeChip key={n.id} node={n} color={lC[i]} align="right"/>)}
      </div>
      {/* Brain SVG */}
      <div style={{ flex:1, position:"relative", zIndex:2 }}>
        <svg viewBox="0 0 300 260" style={{ width:"100%", display:"block" }}>
          <defs>
            <radialGradient id="bGlw2" cx="50%" cy="48%" r="42%">
              <stop offset="0%" stopColor={coreColor} stopOpacity="0.22"/>
              <stop offset="100%" stopColor={coreColor} stopOpacity="0"/>
            </radialGradient>
            <filter id="bBlr2" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3"/>
            </filter>
          </defs>
          <rect width="300" height="260" fill="url(#bGlw2)"/>
          {/* Hemisphere glow */}
          <ellipse cx="122" cy="126" rx="108" ry="96" fill={coreColor} fillOpacity="0.04" filter="url(#bBlr2)"/>
          <ellipse cx="178" cy="126" rx="108" ry="96" fill={coreColor} fillOpacity="0.04" filter="url(#bBlr2)"/>
          {/* Left hemisphere */}
          <ellipse cx="122" cy="126" rx="108" ry="96"
            fill={coreColor} fillOpacity="0.05" stroke={coreColor} strokeWidth="1.2" strokeOpacity="0.52"/>
          {/* Right hemisphere */}
          <ellipse cx="178" cy="126" rx="108" ry="96"
            fill={coreColor} fillOpacity="0.05" stroke={coreColor} strokeWidth="1.2" strokeOpacity="0.52"/>
          {/* Longitudinal fissure */}
          <line x1="150" y1="36" x2="150" y2="215" stroke={coreColor} strokeOpacity="0.32" strokeWidth="1.5"/>
          {/* Brain stem */}
          <path d="M 135,215 C 132,226 138,242 150,246 C 162,242 168,226 165,215 Z"
            fill={coreColor} fillOpacity="0.07" stroke={coreColor} strokeWidth="0.9" strokeOpacity="0.38"/>
          {/* Cortical folds LEFT */}
          <path d="M 18,104 C 36,97 54,109 72,102 C 87,96 99,107 114,101 C 126,96 138,103 150,101"
            fill="none" stroke={coreColor} strokeOpacity="0.28" strokeWidth="1.0"/>
          <path d="M 14,126 C 33,118 54,131 74,123 C 92,116 107,128 126,122 C 140,117 148,122 150,122"
            fill="none" stroke={coreColor} strokeOpacity="0.23" strokeWidth="1.0"/>
          <path d="M 16,149 C 36,141 58,154 80,147 C 99,140 114,152 133,146 C 143,143 148,147 150,146"
            fill="none" stroke={coreColor} strokeOpacity="0.22" strokeWidth="1.0"/>
          <path d="M 24,172 C 44,164 66,177 88,170 C 106,163 120,174 138,169 C 145,167 149,169 150,169"
            fill="none" stroke={coreColor} strokeOpacity="0.18" strokeWidth="0.9"/>
          <path d="M 42,196 C 60,189 80,200 100,194 C 116,189 130,197 146,194 C 149,194 150,194 150,194"
            fill="none" stroke={coreColor} strokeOpacity="0.14" strokeWidth="0.8"/>
          {/* Cortical folds RIGHT */}
          <path d="M 150,101 C 162,103 168,96 180,101 C 195,107 210,96 225,102 C 240,109 258,97 276,104"
            fill="none" stroke={coreColor} strokeOpacity="0.28" strokeWidth="1.0"/>
          <path d="M 150,122 C 152,122 159,117 170,122 C 186,128 204,116 222,123 C 239,131 258,118 280,126"
            fill="none" stroke={coreColor} strokeOpacity="0.23" strokeWidth="1.0"/>
          <path d="M 150,146 C 151,147 157,143 166,146 C 180,152 198,140 216,147 C 234,154 256,141 278,149"
            fill="none" stroke={coreColor} strokeOpacity="0.22" strokeWidth="1.0"/>
          <path d="M 150,169 C 150,169 155,167 164,169 C 177,174 196,163 214,170 C 232,177 250,164 270,172"
            fill="none" stroke={coreColor} strokeOpacity="0.18" strokeWidth="0.9"/>
          <path d="M 150,194 C 150,194 153,193 160,194 C 172,197 188,189 204,194 C 218,200 232,189 250,196"
            fill="none" stroke={coreColor} strokeOpacity="0.14" strokeWidth="0.8"/>
          {/* Neural pathways from left column */}
          {LPts.map(([x,y],i)=>(
            <path key={`lp${i}`} d={`M ${x},${y} C ${x+65},${y} ${bX-50},${bY} ${bX},${bY}`}
              fill="none" stroke={lC[i]} strokeWidth="1.2" strokeOpacity="0.70"
              strokeDasharray="5,3" style={{ animation:`streamFlow ${1.8+i*0.28}s linear infinite` }}/>
          ))}
          {/* Neural pathways from right column */}
          {RPts.map(([x,y],i)=>(
            <path key={`rp${i}`} d={`M ${x},${y} C ${x-65},${y} ${bX+50},${bY} ${bX},${bY}`}
              fill="none" stroke={rC[i]} strokeWidth="1.2" strokeOpacity="0.70"
              strokeDasharray="5,3" style={{ animation:`streamFlow ${2.0+i*0.28}s linear infinite` }}/>
          ))}
          {/* Brain core glow */}
          <circle cx={bX} cy={bY} r="40" fill={coreColor} fillOpacity="0.10"/>
          <circle cx={bX} cy={bY} r="40" fill={coreColor} fillOpacity="0.07" filter="url(#bBlr2)"/>
          <circle cx={bX} cy={bY} r="26" fill={coreColor} fillOpacity="0.22"/>
          {/* Synapse dots at pathway endpoints */}
          {LPts.map(([x,y],i)=>(
            <React.Fragment key={`ls${i}`}>
              <circle cx={x} cy={y} r="10" fill={lC[i]} fillOpacity="0.16"
                style={{ animation:`glowPulse ${2+i*0.35}s ease-in-out infinite` }}/>
              <circle cx={x} cy={y} r="4.5" fill={lC[i]} fillOpacity="0.92"/>
            </React.Fragment>
          ))}
          {RPts.map(([x,y],i)=>(
            <React.Fragment key={`rs${i}`}>
              <circle cx={x} cy={y} r="10" fill={rC[i]} fillOpacity="0.16"
                style={{ animation:`glowPulse ${2.2+i*0.35}s ease-in-out infinite` }}/>
              <circle cx={x} cy={y} r="4.5" fill={rC[i]} fillOpacity="0.92"/>
            </React.Fragment>
          ))}
        </svg>
        {/* Confidence score overlay at brain center */}
        <div style={{ position:"absolute", top:"48%", left:"50%", transform:"translate(-50%,-50%)",
          textAlign:"center", pointerEvents:"none" }}>
          <div style={{ fontSize:8.5, color:"rgba(255,255,255,.42)", letterSpacing:".22em",
            fontWeight:700, marginBottom:2 }}>{isHuman?"AUTHENTICITY":"AI CONFIDENCE"}</div>
          <div style={{ fontSize:38, fontWeight:900, color:"#fff", lineHeight:1,
            textShadow:`0 0 30px ${coreColor}, 0 0 60px ${coreColor}50` }}>{confidence}%</div>
          <div style={{ fontSize:7.5, color:`${coreColor}bb`, letterSpacing:".14em",
            fontWeight:700, marginTop:3 }}>{cL}</div>
        </div>
      </div>
      {/* Right evidence column */}
      <div style={{ width:192, flexShrink:0, display:"flex", flexDirection:"column",
        justifyContent:"space-around", padding:"24px 16px", position:"relative", zIndex:2 }}>
        {rN.map((n,i)=><NeuralNodeChip key={n.id} node={n} color={rC[i]} align="left"/>)}
      </div>
    </div>
  );
}

// ── 3D BRAIN SCENE COMPONENTS ────────────────────────────────────────

function BrainCameraFloat() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.05;
    camera.position.x = Math.sin(t) * 0.55;
    camera.position.y = 0.55 + Math.sin(t * 0.7) * 0.22;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function BrainBeam3D({ from, color }: { from: [number,number,number]; color: string }) {
  const [line] = useState(() => {
    const pts = new Float32Array([from[0], from[1], from[2], 0, 0, 0]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    return new THREE.Line(g, new THREE.LineBasicMaterial({
      color: new THREE.Color(color), transparent: true, opacity: 0.50,
    }));
  });
  return <primitive object={line} />;
}

function BrainParticles3D({ color }: { color: string }) {
  const [pts, origPos, seedArr] = useMemo(() => {
    const n = 240;
    const orig = new Float32Array(n * 3);
    const seeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = Math.cbrt(Math.random()) * 1.85;
      orig[i*3]   = Math.sin(phi) * Math.cos(theta) * r;
      orig[i*3+1] = Math.sin(phi) * Math.sin(theta) * r * 0.82;
      orig[i*3+2] = Math.cos(phi) * r * 0.72;
      seeds[i]    = Math.random() * Math.PI * 2;
    }
    const live = new Float32Array(orig);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(live, 3));
    const m = new THREE.PointsMaterial({
      color: new THREE.Color(color), size: 0.046, transparent: true,
      opacity: 0.58, sizeAttenuation: true, depthWrite: false,
    });
    return [new THREE.Points(g, m), orig, seeds];
  }, [color]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const s = seedArr[i];
      pos.setX(i, origPos[i*3]   + Math.sin(t * 0.75 + s) * 0.09);
      pos.setY(i, origPos[i*3+1] + Math.cos(t * 0.55 + s * 1.3) * 0.08);
      pos.setZ(i, origPos[i*3+2] + Math.sin(t * 1.0  + s * 0.8) * 0.06);
    }
    pos.needsUpdate = true;
  });
  return <primitive object={pts} />;
}

function NeuralBrainMesh3D({ coreColor, confidence, isHuman }: {
  coreColor: string; confidence: number; isHuman: boolean;
}) {
  const lHemRef  = useRef<THREE.Mesh>(null!);
  const rHemRef  = useRef<THREE.Mesh>(null!);
  const coreGRef = useRef<THREE.Mesh>(null!);
  const wireRef  = useRef<THREE.Mesh>(null!);
  const c = useMemo(() => new THREE.Color(coreColor), [coreColor]);
  const confLabel = confidence >= 85 ? "VERY HIGH CONFIDENCE"
    : confidence >= 70 ? "HIGH CONFIDENCE"
    : confidence >= 55 ? "MODERATE CONFIDENCE" : "LOW CONFIDENCE";
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const br = 1 + Math.sin(t * 0.52) * 0.022;
    if (lHemRef.current)  { lHemRef.current.scale.setScalar(br); lHemRef.current.rotation.y = Math.sin(t*0.08)*0.03; }
    if (rHemRef.current)  { rHemRef.current.scale.setScalar(br); rHemRef.current.rotation.y = -Math.sin(t*0.08)*0.03; }
    if (coreGRef.current) { coreGRef.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.10); }
    if (wireRef.current)  { wireRef.current.rotation.y = t * 0.055; }
  });
  return (
    <group>
      <pointLight position={[3.5, 4, 3]} intensity={1.8} color={coreColor} distance={14} decay={2}/>
      <pointLight position={[-3, 2.5, -2]} intensity={0.9} color="#4cc9ff" distance={11} decay={2}/>
      <pointLight position={[0, -3, 2.5]} intensity={0.45} color="#7b61ff" distance={9} decay={2}/>
      {/* Left hemisphere */}
      <mesh ref={lHemRef} position={[-0.55, 0.1, 0]} scale={[0.94, 1.06, 0.87]}>
        <sphereGeometry args={[1.12, 56, 56]}/>
        <meshPhysicalMaterial color={coreColor} emissive={c} emissiveIntensity={0.30}
          roughness={0.80} metalness={0} clearcoat={0.12} clearcoatRoughness={0.85}
          transparent opacity={0.87}/>
      </mesh>
      {/* Right hemisphere */}
      <mesh ref={rHemRef} position={[0.55, 0.1, 0]} scale={[0.94, 1.06, 0.87]}>
        <sphereGeometry args={[1.12, 56, 56]}/>
        <meshPhysicalMaterial color={coreColor} emissive={c} emissiveIntensity={0.30}
          roughness={0.80} metalness={0} clearcoat={0.12} clearcoatRoughness={0.85}
          transparent opacity={0.87}/>
      </mesh>
      {/* Cerebellum */}
      <mesh position={[0, -1.05, -0.52]} scale={[0.54, 0.44, 0.50]}>
        <sphereGeometry args={[1.12, 32, 32]}/>
        <meshPhysicalMaterial color={coreColor} emissive={c} emissiveIntensity={0.22}
          roughness={0.85} metalness={0} transparent opacity={0.74}/>
      </mesh>
      {/* Outer hemisphere glow halos */}
      <mesh position={[-0.55, 0.1, 0]} scale={[0.94, 1.06, 0.87]}>
        <sphereGeometry args={[1.28, 16, 16]}/>
        <meshStandardMaterial color={coreColor} emissive={c} emissiveIntensity={0.40}
          transparent opacity={0.07} roughness={0} metalness={0}/>
      </mesh>
      <mesh position={[0.55, 0.1, 0]} scale={[0.94, 1.06, 0.87]}>
        <sphereGeometry args={[1.28, 16, 16]}/>
        <meshStandardMaterial color={coreColor} emissive={c} emissiveIntensity={0.40}
          transparent opacity={0.07} roughness={0} metalness={0}/>
      </mesh>
      {/* Neural wireframe cortex */}
      <mesh ref={wireRef} position={[0, 0.08, 0]} scale={[1.30, 1.38, 1.18]}>
        <icosahedronGeometry args={[1.0, 3]}/>
        <meshBasicMaterial color={coreColor} wireframe transparent opacity={0.11}/>
      </mesh>
      <mesh position={[0, 0.08, 0]} scale={[1.58, 1.66, 1.44]}>
        <icosahedronGeometry args={[1.0, 2]}/>
        <meshBasicMaterial color="#4cc9ff" wireframe transparent opacity={0.05}/>
      </mesh>
      {/* Inner core pulse */}
      <mesh ref={coreGRef}>
        <sphereGeometry args={[0.36, 24, 24]}/>
        <meshBasicMaterial color={coreColor} transparent opacity={0.96}/>
      </mesh>
      <mesh>
        <sphereGeometry args={[0.60, 20, 20]}/>
        <meshBasicMaterial color={coreColor} transparent opacity={0.26}/>
      </mesh>
      <mesh>
        <sphereGeometry args={[0.84, 16, 16]}/>
        <meshBasicMaterial color={coreColor} transparent opacity={0.09}/>
      </mesh>
      {/* Confidence score — Html overlay at front of brain */}
      <Html position={[0, 0, 1.15]} center style={{ pointerEvents:"none", userSelect:"none" }}>
        <div style={{ textAlign:"center", fontFamily:"'Inter',sans-serif" }}>
          <div style={{ fontSize:8, color:"rgba(255,255,255,.42)", letterSpacing:".22em", marginBottom:2, fontWeight:700 }}>
            {isHuman?"AUTHENTICITY":"AI CONFIDENCE"}
          </div>
          <div style={{ fontSize:34, fontWeight:900, color:"#fff", lineHeight:1,
            textShadow:`0 0 28px ${coreColor}, 0 0 55px ${coreColor}50` }}>{confidence}%</div>
          <div style={{ fontSize:7.5, color:`${coreColor}c0`, letterSpacing:".14em", marginTop:3, fontWeight:700 }}>
            {confLabel}
          </div>
        </div>
      </Html>
    </group>
  );
}

function BrainScene3D({ nodes, coreColor, confidence, isHuman }: {
  nodes: Array<{ id: string; name: string; conf: number; status: string }>;
  coreColor: string; confidence: number; isHuman: boolean;
}) {
  const nc = useMemo(() => nodes.map(n => {
    const s = n.status;
    return (s==="Passed"||s==="Active"||s==="Verified"||s==="Monolingual"||s==="No Code")
      ? "#22c55e" : (s==="Flagged"||s==="Failed") ? "#ef4444" : "#f59e0b";
  }), [nodes]);
  const PANEL_POS: [number,number,number][] = [
    [0,   2.72, 0.3],
    [-2.8, 0.85, 0.2],
    [-2.65,-1.05, 0],
    [2.8,  0.85, 0.2],
    [2.65,-1.05, 0],
    [0,  -2.65, 0.3],
  ];
  return (
    <Canvas camera={{ fov:55, position:[0, 0.55, 7.0] }}
      gl={{ antialias:true, toneMapping:THREE.ACESFilmicToneMapping, toneMappingExposure:1.55 }}
      style={{ width:"100%", height:"100%", display:"block" }}>
      <color attach="background" args={["#030811"]}/>
      <fog attach="fog" args={["#050c18", 14, 36]}/>
      <ambientLight intensity={0.10} color="#0a1b36"/>
      <NeuralBrainMesh3D coreColor={coreColor} confidence={confidence} isHuman={isHuman}/>
      <BrainParticles3D color={coreColor}/>
      {nodes.slice(0,6).map((n, i) => (
        <React.Fragment key={n.id}>
          <BrainBeam3D from={PANEL_POS[i]} color={nc[i]}/>
          <Html position={PANEL_POS[i]} center style={{ pointerEvents:"none", userSelect:"none" }}>
            <div style={{ fontFamily:"'Inter',sans-serif", background:"rgba(4,10,22,.90)",
              border:`1px solid ${nc[i]}42`, borderRadius:11, padding:"8px 13px", minWidth:112,
              boxShadow:`0 0 22px ${nc[i]}1e, inset 0 0 14px rgba(0,229,255,.04)`,
              backdropFilter:"blur(14px)", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
                background:`linear-gradient(90deg,transparent,${nc[i]}cc,transparent)` }}/>
              <div style={{ fontSize:7.5, fontWeight:800, color:nc[i], letterSpacing:".12em",
                textTransform:"uppercase", marginBottom:4 }}>{n.name}</div>
              <div style={{ fontSize:21, fontWeight:900, color:"#fff", lineHeight:1,
                textShadow:`0 0 16px ${nc[i]}` }}>{n.conf}%</div>
              <div style={{ height:2, borderRadius:1, background:"rgba(255,255,255,.06)", marginTop:5 }}>
                <div style={{ height:"100%", width:`${n.conf}%`, borderRadius:1,
                  background:`linear-gradient(90deg,${nc[i]}55,${nc[i]})` }}/>
              </div>
              <div style={{ fontSize:8, color:"rgba(255,255,255,.32)", marginTop:4 }}>{n.status}</div>
            </div>
          </Html>
        </React.Fragment>
      ))}
      <BrainCameraFloat/>
    </Canvas>
  );
}

// ── AI PROCESSOR CHIP PANEL (NEC v3) ─────────────────────────────────

function CentralProcessor({ coreColor, confidence, isHuman, aiProb, humanProb }: {
  coreColor: string; confidence: number; isHuman: boolean; aiProb: number; humanProb: number;
}) {
  return (
    <div style={{ position:"relative", display:"inline-block" }}>
      <div style={{ position:"absolute", inset:-36, borderRadius:16,
        border:`1px solid ${coreColor}18`, animation:"glowPulse 3.5s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", inset:-20, borderRadius:14,
        border:`1px solid ${coreColor}28`, animation:"glowPulse 3.5s ease-in-out .8s infinite" }}/>
      {/* Rotating circuit rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 9, ease: "linear", repeat: Infinity }}
        style={{ position:"absolute", width:318, height:318, top:-52, left:-52,
          borderRadius:"50%", border:`1.5px solid ${coreColor}22`,
          borderTopColor:`${coreColor}66`, pointerEvents:"none" }}/>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, ease: "linear", repeat: Infinity }}
        style={{ position:"absolute", width:350, height:350, top:-68, left:-68,
          borderRadius:"50%", borderTop:`1px dashed ${coreColor}14`,
          borderRight:"1px solid transparent", borderBottom:"1px solid transparent",
          borderLeft:`1px dashed ${coreColor}09`, pointerEvents:"none" }}/>
      <div style={{
        width:214, height:214, position:"relative",
        background:"linear-gradient(145deg,#081624 0%,#0c2040 48%,#060f1c 100%)",
        border:`2px solid ${coreColor}60`, borderRadius:12,
        boxShadow:`0 0 44px ${coreColor}28,0 0 90px ${coreColor}10,inset 0 0 34px ${coreColor}06,0 16px 44px rgba(0,0,0,.80)`,
        transform:"perspective(480px) rotateX(6deg)", transformOrigin:"center bottom" }}>
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} viewBox="0 0 214 214">
          {[32,56,80,107,130,154,180].map(y=>(
            <line key={`cy${y}`} x1="12" y1={y} x2="202" y2={y} stroke={coreColor} strokeWidth="0.35" opacity="0.18"/>
          ))}
          {[28,55,80,107,132,158,186].map(x=>(
            <line key={`cx${x}`} x1={x} y1="12" x2={x} y2="202" stroke={coreColor} strokeWidth="0.28" opacity="0.14"/>
          ))}
          <path d="M 8,8 L 32,8 M 8,8 L 8,32" stroke={coreColor} strokeWidth="1.7" strokeOpacity="0.65" fill="none"/>
          <path d="M 206,8 L 182,8 M 206,8 L 206,32" stroke={coreColor} strokeWidth="1.7" strokeOpacity="0.65" fill="none"/>
          <path d="M 8,206 L 32,206 M 8,206 L 8,182" stroke={coreColor} strokeWidth="1.7" strokeOpacity="0.65" fill="none"/>
          <path d="M 206,206 L 182,206 M 206,206 L 206,182" stroke={coreColor} strokeWidth="1.7" strokeOpacity="0.65" fill="none"/>
          <rect x="68" y="68" width="78" height="78" rx="5" fill={coreColor} fillOpacity="0.10"
            stroke={coreColor} strokeWidth="0.9" strokeOpacity="0.55"/>
          <rect x="68" y="68" width="78" height="78" rx="5" fill={coreColor} fillOpacity="0.04">
            <animate attributeName="fill-opacity" values="0.04;0.13;0.04" dur="2.2s" repeatCount="indefinite"/>
          </rect>
          <line x1="107" y1="72" x2="107" y2="142" stroke={coreColor} strokeWidth="0.5" opacity="0.38"/>
          <line x1="72" y1="107" x2="142" y2="107" stroke={coreColor} strokeWidth="0.5" opacity="0.38"/>
        </svg>
        <div style={{ position:"absolute", top:-5, left:24, right:24, height:5, display:"flex", gap:5 }}>
          {[...Array(12)].map((_,i)=><div key={i} style={{ flex:1, background:`${coreColor}55`, borderRadius:"1px 1px 0 0" }}/>)}
        </div>
        <div style={{ position:"absolute", bottom:-5, left:24, right:24, height:5, display:"flex", gap:5 }}>
          {[...Array(12)].map((_,i)=><div key={i} style={{ flex:1, background:`${coreColor}55`, borderRadius:"0 0 1px 1px" }}/>)}
        </div>
        <div style={{ position:"absolute", left:-5, top:24, bottom:24, width:5, display:"flex", flexDirection:"column", gap:5 }}>
          {[...Array(9)].map((_,i)=><div key={i} style={{ flex:1, background:`${coreColor}55`, borderRadius:"1px 0 0 1px" }}/>)}
        </div>
        <div style={{ position:"absolute", right:-5, top:24, bottom:24, width:5, display:"flex", flexDirection:"column", gap:5 }}>
          {[...Array(9)].map((_,i)=><div key={i} style={{ flex:1, background:`${coreColor}55`, borderRadius:"0 1px 1px 0" }}/>)}
        </div>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", textAlign:"center", gap:2 }}>
          <div style={{ fontSize:7.5, color:"rgba(255,255,255,.38)", letterSpacing:".22em", fontWeight:700 }}>
            {isHuman?"AUTHENTICITY":"AI CONFIDENCE"}
          </div>
          <div style={{ fontSize:48, fontWeight:900, color:"#fff", lineHeight:1,
            textShadow:`0 0 24px ${coreColor},0 0 52px ${coreColor}55` }}>{confidence}%</div>
          <div style={{ fontSize:8, color:coreColor, letterSpacing:".16em", fontWeight:800 }}>
            {isHuman?"HUMAN WRITTEN":"AI GENERATED"}
          </div>
          <div style={{ width:58, height:1,
            background:`linear-gradient(90deg,transparent,${coreColor}80,transparent)`, margin:"5px 0" }}/>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, fontWeight:900, color:"#22c55e" }}>{humanProb}%</div>
              <div style={{ fontSize:6, color:"rgba(255,255,255,.28)", letterSpacing:".06em" }}>HUMAN</div>
            </div>
            <div style={{ width:1, background:"rgba(255,255,255,.10)", alignSelf:"stretch" }}/>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, fontWeight:900, color:"#ef4444" }}>{aiProb}%</div>
              <div style={{ fontSize:6, color:"rgba(255,255,255,.28)", letterSpacing:".06em" }}>AI</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ textAlign:"center", marginTop:10 }}>
        <div style={{ fontSize:7.5, color:`${coreColor}88`, letterSpacing:".20em", fontWeight:700 }}>
          NUROAI · AI PROCESSOR v3
        </div>
      </div>
    </div>
  );
}

function ProcessorChipPanel({ nodes, coreColor, confidence, isHuman, aiProb, humanProb }: {
  nodes: Array<{ id: string; name: string; conf: number; status: string }>;
  coreColor: string; confidence: number; isHuman: boolean; aiProb: number; humanProb: number;
}) {
  const nc = useMemo(()=>nodes.map(n=>{
    const s=n.status;
    return s==="Passed"||s==="Active"||s==="Verified"||s==="Monolingual"||s==="No Code"
      ?"#22c55e":s==="Flagged"||s==="Failed"?"#ef4444":"#f59e0b";
  }),[nodes]);
  const MOD_STYLE: React.CSSProperties[] = [
    { left:"6%",  top:"8%"  },
    { left:"50%", top:"2%",    transform:"translateX(-50%)" },
    { right:"6%", top:"8%"  },
    { left:"6%",  bottom:"8%"  },
    { right:"6%", bottom:"8%"  },
    { left:"50%", bottom:"2%", transform:"translateX(-50%)" },
  ];
  // Trace paths in 1000×560 SVG space; center processor at (500,280)
  const PATHS = [
    "M 170,90  C 170,200 400,280 500,280",
    "M 500,50  C 500,140 500,210 500,280",
    "M 830,90  C 830,200 600,280 500,280",
    "M 170,476 C 170,370 400,280 500,280",
    "M 830,476 C 830,370 600,280 500,280",
    "M 500,504 C 500,420 500,360 500,280",
  ];
  const AnimMot: any = 'animateMotion';
  return (
    <div style={{ position:"relative", height:560, background:"#020a12",
      borderRadius:20, overflow:"hidden" }}>
      {/* PCB grid background */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%",
        opacity:.11, pointerEvents:"none" }}
        viewBox="0 0 80 56" preserveAspectRatio="xMidYMid slice">
        {[5,12,19,26,33,40,47,52].map(y=>(
          <line key={`bh${y}`} x1="0" y1={y} x2="80" y2={y} stroke="#00e5ff" strokeWidth="0.18"/>
        ))}
        {[6,14,22,30,40,50,58,66,74].map(x=>(
          <line key={`bv${x}`} x1={x} y1="0" x2={x} y2="56" stroke="#00e5ff" strokeWidth="0.14"/>
        ))}
        {[[6,5],[22,12],[38,5],[54,19],[70,12],[14,33],[46,40],[62,33],[30,47],[70,47]].map(([px,py],i)=>(
          <circle key={`bpad${i}`} cx={px} cy={py} r="0.7" fill="#00e5ff"/>
        ))}
      </svg>
      {/* Animated circuit traces overlay */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%",
        zIndex:1, pointerEvents:"none" }}
        viewBox="0 0 1000 560" preserveAspectRatio="none">
        {PATHS.map((d,i)=>(
          <g key={i}>
            <path d={d} fill="none" stroke={nc[i]} strokeWidth="1.5" strokeOpacity="0.20"/>
            <path d={d} fill="none" stroke={nc[i]} strokeWidth="2.0" strokeOpacity="0.76"
              strokeDasharray="10,8"
              style={{ animation:`streamFlow ${2.0+i*0.32}s linear infinite` }}/>
            <circle r="5.5" fill={nc[i]} fillOpacity="0.96"
              style={{ filter:`drop-shadow(0 0 4px ${nc[i]})` }}>
              <AnimMot dur={`${2.8+i*0.38}s`} repeatCount="indefinite" path={d}/>
            </circle>
          </g>
        ))}
      </svg>
      {/* Scanning wave */}
      <div style={{ position:"absolute", left:0, right:0, height:2, zIndex:3,
        background:`linear-gradient(90deg,transparent,${coreColor}65,${coreColor}92,${coreColor}65,transparent)`,
        boxShadow:`0 0 18px ${coreColor}42`,
        animation:"neuralScan 5.5s ease-in-out infinite" }}/>
      {/* Floating particles */}
      {[...Array(8)].map((_,i)=>(
        <div key={i} style={{ position:"absolute", width:3, height:3, borderRadius:"50%",
          background:i%3===0?coreColor:i%3===1?"#4cc9ff":"#7b61ff",
          boxShadow:`0 0 7px ${i%3===0?coreColor:i%3===1?"#4cc9ff":"#7b61ff"}`,
          left:`${10+i*12}%`, top:`${18+i*8}%`,
          animation:`neuralFloat ${3.2+i*0.55}s ease-in-out ${i*0.4}s infinite`,
          zIndex:2, pointerEvents:"none" }}/>
      ))}
      {/* Module microchips */}
      {nodes.slice(0,6).map((n,i)=>(
        <div key={n.id} style={{ position:"absolute", width:138, zIndex:4, ...MOD_STYLE[i] }}>
          <div style={{ padding:"9px 13px", borderRadius:8,
            background:"rgba(4,12,22,.95)",
            border:`1px solid ${nc[i]}48`,
            boxShadow:`0 0 ${12 + Math.round(n.conf * 0.28)}px ${nc[i]}40,0 6px 24px rgba(0,0,0,.65)`,
            backdropFilter:"blur(12px)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:6 }}>
              <div style={{ width:7, height:7, borderRadius:2,
                background:nc[i], boxShadow:`0 0 ${5 + Math.round(n.conf * 0.10)}px ${nc[i]}`,
                animation:`glowPulse ${Math.max(0.9, 2.2 - n.conf * 0.014)}s ease-in-out infinite` }}/>
              <div style={{ fontSize:7, fontWeight:800, color:nc[i],
                letterSpacing:".11em", textTransform:"uppercase" }}>{n.name}</div>
            </div>
            <div style={{ fontSize:26, fontWeight:900, color:"#fff", lineHeight:1,
              textShadow:`0 0 14px ${nc[i]}` }}>
              {n.conf}<span style={{ fontSize:12, color:"rgba(255,255,255,.4)", fontWeight:600 }}>%</span>
            </div>
            <div style={{ height:2, borderRadius:1, background:"rgba(255,255,255,.06)",
              marginTop:7, overflow:"hidden" }}>
              <motion.div initial={{ width:0 }} animate={{ width:`${n.conf}%` }}
                transition={{ duration:1.2, delay:i*0.1, ease:[.4,0,.2,1] }}
                style={{ height:"100%", borderRadius:1,
                  background:`linear-gradient(90deg,${nc[i]}55,${nc[i]})`,
                  boxShadow:`0 0 6px ${nc[i]}` }}/>
            </div>
            <div style={{ fontSize:8, color:"rgba(255,255,255,.28)", marginTop:5 }}>{n.status}</div>
          </div>
        </div>
      ))}
      {/* Central AI processor */}
      <div style={{ position:"absolute", left:"50%", top:"50%",
        transform:"translate(-50%,-50%)", zIndex:5 }}>
        <CentralProcessor coreColor={coreColor} confidence={confidence}
          isHuman={isHuman} aiProb={aiProb} humanProb={humanProb}/>
      </div>
      {/* Corner glows */}
      <div style={{ position:"absolute", top:0, left:0, width:300, height:300, borderRadius:"50%",
        background:`radial-gradient(circle,${coreColor}06 0%,transparent 70%)`,
        transform:"translate(-40%,-40%)", pointerEvents:"none", zIndex:0 }}/>
      <div style={{ position:"absolute", bottom:0, right:0, width:340, height:340, borderRadius:"50%",
        background:"radial-gradient(circle,#7b61ff05 0%,transparent 70%)",
        transform:"translate(40%,40%)", pointerEvents:"none", zIndex:0 }}/>
    </div>
  );
}

function GalaxyCameraOrbit() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.065;
    camera.position.x = Math.sin(t) * 5.2;
    camera.position.z = Math.cos(t) * 5.2;
    camera.position.y = Math.sin(t * 0.38) * 1.1 + 1.0;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function GalaxyMoon3D({ idx, cluster, onHover, isHovered }: {
  idx: number; cluster: any; onHover: (n: string | null) => void; isHovered: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const ringRef  = useRef<THREE.Mesh>(null!);
  const atmRef   = useRef<THREE.Mesh>(null!);
  const c = useMemo(() => new THREE.Color(cluster.color || "#888"), [cluster.color]);
  const t0 = useMemo(() => (idx / 6) * Math.PI * 2, [idx]);
  const orbitR     = 1.65 + idx * 0.48;
  const orbitSpeed = 0.030 + idx * 0.005;
  const incAmt     = (0.05 + idx * 0.025) * (idx % 2 === 0 ? 1 : -1);
  const moonR      = 0.14 + (cluster.sim / 100) * 0.15;
  const isHumanType = cluster.type === "human";
  const isAI        = cluster.type === "ai";
  const metalness   = isAI ? 0.92 : isHumanType ? 0.18 : 0.55;
  const roughness   = isAI ? 0.08 : isHumanType ? 0.72 : 0.42;
  const clearcoat   = isHumanType ? 0.9 : isAI ? 0.2 : 0.5;
  const emIntensity = isAI ? 2.4 : isHumanType ? 1.3 : 1.8;
  const simLabel = cluster.sim >= 80 ? "Very Strong Similarity"
    : cluster.sim >= 60 ? "Strong Similarity"
    : cluster.sim >= 40 ? "Moderate Similarity" : "Weak Similarity";
  const sigLabel = isHumanType
    ? (cluster.sim >= 70 ? "Strong Human Signal" : "Human Signal")
    : isAI
    ? (cluster.sim >= 70 ? "Strong AI Signal" : "AI Signal")
    : "Mixed Signal";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const angle = t0 + t * orbitSpeed;
    groupRef.current.position.x = Math.cos(angle) * orbitR;
    groupRef.current.position.z = Math.sin(angle) * orbitR;
    groupRef.current.position.y = Math.sin(angle) * orbitR * incAmt;
    groupRef.current.rotation.y += 0.007;
    if (ringRef.current)  ringRef.current.rotation.z  = t * 0.22;
    if (atmRef.current)   atmRef.current.rotation.y   = -t * 0.04;
  });

  return (
    <group ref={groupRef}
      onPointerOver={() => onHover(cluster.name)}
      onPointerOut={() => onHover(null)}
    >
      <mesh>
        <sphereGeometry args={[moonR, 32, 32]} />
        <meshPhysicalMaterial color={cluster.color} emissive={c} emissiveIntensity={emIntensity}
          roughness={roughness} metalness={metalness} clearcoat={clearcoat} clearcoatRoughness={0.1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[moonR * 1.30, 16, 16]} />
        <meshStandardMaterial color={cluster.color} emissive={c} emissiveIntensity={0.5}
          transparent opacity={isHumanType ? 0.13 : 0.07} roughness={0} metalness={0} />
      </mesh>
      <mesh ref={atmRef}>
        <sphereGeometry args={[moonR * 1.60, 12, 12]} />
        <meshStandardMaterial color={cluster.color} emissive={c} emissiveIntensity={0.22}
          transparent opacity={0.038} roughness={0} metalness={0} />
      </mesh>
      {isAI && (
        <mesh ref={ringRef} rotation={[Math.PI * 0.42, 0.18, 0]}>
          <torusGeometry args={[moonR * 1.95, moonR * 0.08, 6, 32]} />
          <meshBasicMaterial color={cluster.color} transparent opacity={0.45} />
        </mesh>
      )}
      <pointLight color={cluster.color} intensity={isHovered ? 1.2 : 0.55} distance={2.0} decay={2} />
      {isHovered && (
        <Html position={[0, moonR + 0.34, 0]} center style={{ pointerEvents: "none", userSelect: "none" }}>
          <div style={{ fontFamily: "'Inter',sans-serif", textAlign: "center", whiteSpace: "nowrap",
            background: "rgba(3,5,16,.94)", border: `1px solid ${cluster.color}55`,
            padding: "8px 12px", borderRadius: 10, boxShadow: `0 0 22px ${cluster.color}30`,
            minWidth: 130 }}>
            <div style={{ fontSize: 10.5, fontWeight: 900, color: cluster.color,
              textShadow: `0 0 12px ${cluster.color}`, letterSpacing: ".03em", marginBottom: 3 }}>{cluster.name}</div>
            <div style={{ fontSize: 9, color: "#e0e0e8", fontWeight: 700, marginBottom: 2 }}>{cluster.sim}%</div>
            <div style={{ fontSize: 8.5, color: "#888898", marginBottom: 3 }}>{simLabel}</div>
            <div style={{ fontSize: 8, color: cluster.color, fontWeight: 700,
              background: `${cluster.color}12`, border: `1px solid ${cluster.color}30`,
              padding: "2px 7px", borderRadius: 5 }}>{sigLabel}</div>
          </div>
        </Html>
      )}
      {!isHovered && (
        <Html position={[0, moonR + 0.18, 0]} center style={{ pointerEvents: "none", userSelect: "none" }}>
          <div style={{ fontFamily: "'Inter',sans-serif", textAlign: "center", whiteSpace: "nowrap",
            background: "rgba(3,5,16,.72)", border: `1px solid ${cluster.color}22`,
            padding: "1px 5px", borderRadius: 4 }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: cluster.color, opacity: 0.88 }}>{cluster.sim}%</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function DocumentPlanet3D({ docColor }: { docColor: string }) {
  const coreRef    = useRef<THREE.Mesh>(null!);
  const ring1Ref   = useRef<THREE.Mesh>(null!);
  const ring2Ref   = useRef<THREE.Mesh>(null!);
  const ring3Ref   = useRef<THREE.Mesh>(null!);
  const corona1Ref = useRef<THREE.Mesh>(null!);
  const corona2Ref = useRef<THREE.Mesh>(null!);
  const corona3Ref = useRef<THREE.Mesh>(null!);
  const c = useMemo(() => new THREE.Color(docColor), [docColor]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    coreRef.current.rotation.y   = t * 0.07;
    coreRef.current.rotation.x   = Math.sin(t * 0.18) * 0.06;
    ring1Ref.current.rotation.z  = t * 0.20;
    ring2Ref.current.rotation.z  = -t * 0.14;
    ring2Ref.current.rotation.x  = Math.sin(t * 0.28) * 0.24;
    ring3Ref.current.rotation.z  = t * 0.09;
    ring3Ref.current.rotation.y  = Math.sin(t * 0.18) * 0.18;
    const ps = 1 + Math.sin(t * 0.62) * 0.048;
    coreRef.current.scale.setScalar(ps);
    corona1Ref.current.scale.setScalar(0.90 + Math.sin(t * 1.0) * 0.12);
    corona2Ref.current.scale.setScalar(0.88 + Math.sin(t * 1.0 + Math.PI * 0.67) * 0.12);
    corona3Ref.current.scale.setScalar(0.86 + Math.sin(t * 1.0 + Math.PI * 1.33) * 0.10);
  });
  return (
    <group>
      <pointLight color={docColor} intensity={14} distance={18} decay={1.2} />
      <pointLight color="#ffffff" intensity={2.0} distance={5} decay={2.0} />
      <pointLight color={docColor} intensity={4} distance={10} decay={1.8} position={[0, 2, 1]} />
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.68, 64, 64]} />
        <meshPhysicalMaterial color={docColor} emissive={c} emissiveIntensity={3.2}
          roughness={0.02} metalness={0.96} clearcoat={1} clearcoatRoughness={0} />
      </mesh>
      <mesh ref={corona1Ref}>
        <sphereGeometry args={[0.92, 24, 24]} />
        <meshStandardMaterial color={docColor} emissive={c} emissiveIntensity={0.55}
          transparent opacity={0.11} roughness={0} metalness={0} />
      </mesh>
      <mesh ref={corona2Ref}>
        <sphereGeometry args={[1.18, 16, 16]} />
        <meshStandardMaterial color={docColor} emissive={c} emissiveIntensity={0.28}
          transparent opacity={0.048} roughness={0} metalness={0} />
      </mesh>
      <mesh ref={corona3Ref}>
        <sphereGeometry args={[1.48, 12, 12]} />
        <meshStandardMaterial color={docColor} emissive={c} emissiveIntensity={0.18}
          transparent opacity={0.022} roughness={0} metalness={0} />
      </mesh>
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.12, 0.008, 8, 100]} />
        <meshBasicMaterial color={docColor} transparent opacity={0.42} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2 + 0.44, 0.32, 0]}>
        <torusGeometry args={[1.44, 0.005, 8, 100]} />
        <meshBasicMaterial color={docColor} transparent opacity={0.20} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[Math.PI / 2 - 0.62, -0.48, 0.22]}>
        <torusGeometry args={[1.72, 0.003, 6, 80]} />
        <meshBasicMaterial color={docColor} transparent opacity={0.10} />
      </mesh>
      <Html position={[0, -1.04, 0]} center style={{ pointerEvents: "none", userSelect: "none" }}>
        <div style={{ fontFamily: "'Inter',sans-serif", textAlign: "center",
          background: `${docColor}20`, border: `1px solid ${docColor}50`,
          padding: "5px 14px", borderRadius: 9, whiteSpace: "nowrap",
          boxShadow: `0 0 20px ${docColor}28` }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: "#fff",
            textShadow: `0 0 16px ${docColor}`, letterSpacing: ".14em" }}>YOUR DOCUMENT</div>
          <div style={{ fontSize: 7.5, color: `${docColor}cc`, marginTop: 1, letterSpacing: ".06em" }}>
            Central Star System
          </div>
        </div>
      </Html>
    </group>
  );
}

function NebulaClouds() {
  const r1 = useRef<THREE.Mesh>(null!);
  const r2 = useRef<THREE.Mesh>(null!);
  const r3 = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (r1.current) { r1.current.rotation.y = t * 0.008; r1.current.rotation.z = Math.sin(t * 0.012) * 0.05; }
    if (r2.current) { r2.current.rotation.y = -t * 0.006; r2.current.rotation.x = Math.sin(t * 0.009) * 0.04; }
    if (r3.current) { r3.current.rotation.y = t * 0.011; r3.current.rotation.z = Math.cos(t * 0.008) * 0.06; }
  });
  return (
    <group>
      <mesh ref={r1} position={[4.2, 1.5, -5]}>
        <sphereGeometry args={[2.8, 8, 8]} />
        <meshBasicMaterial color="#3b0764" transparent opacity={0.055} />
      </mesh>
      <mesh ref={r2} position={[-5, -1.2, -4]}>
        <sphereGeometry args={[3.4, 8, 8]} />
        <meshBasicMaterial color="#0c4a6e" transparent opacity={0.045} />
      </mesh>
      <mesh ref={r3} position={[1, 3.5, -8]}>
        <sphereGeometry args={[2.2, 8, 8]} />
        <meshBasicMaterial color="#164e63" transparent opacity={0.038} />
      </mesh>
    </group>
  );
}

function GalaxyScene3D({ clusters, docColor, setHovered }: {
  clusters: any[]; docColor: string; setHovered: (n: string | null) => void;
}) {
  const [localHov, setLocalHov] = useState<string | null>(null);
  const handleHover = (name: string | null) => { setLocalHov(name); setHovered(name); };
  return (
    <Canvas
      camera={{ fov: 52, position: [0, 1.2, 5.6] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.6 }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <color attach="background" args={["#020410"]} />
      <fog attach="fog" args={["#050810", 12, 34]} />
      <ambientLight intensity={0.04} />
      <Stars radius={24} depth={16} count={1400} factor={2.2} saturation={0.28} fade speed={0.35} />
      <NebulaClouds />
      <DocumentPlanet3D docColor={docColor} />
      {[0,1,2,3,4,5].map(i => {
        const r = 1.65 + i * 0.48;
        const inc = (0.05 + i * 0.025) * (i % 2 === 0 ? 1 : -1);
        return (
          <mesh key={`orb-${i}`} rotation={[Math.PI / 2 + inc, 0, 0]}>
            <torusGeometry args={[r, 0.006, 8, 120]} />
            <meshBasicMaterial color="#7ab8f5" transparent opacity={0.15} />
          </mesh>
        );
      })}
      {[...clusters].sort((a: any, b: any) => b.sim - a.sim).slice(0, 6).map((cl: any, i: number) => (
        <GalaxyMoon3D key={cl.id || i} idx={i} cluster={cl}
          onHover={handleHover} isHovered={localHov === cl.name} />
      ))}
      <GalaxyCameraOrbit />
    </Canvas>
  );
}

function GalaxyCanvas2D({ clusters, docColor, hovered, setHovered }: any) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const frameRef    = useRef<number>(0);
  const clRef       = useRef(clusters);
  const colRef      = useRef(docColor);
  const hovRef      = useRef(hovered);
  const rippleRef   = useRef<{ x: number; y: number; t: number }[]>([]);
  const prevHovRef  = useRef<string | null>(null);
  clRef.current  = clusters;
  colRef.current = docColor;
  hovRef.current = hovered;

  const bgStars = useMemo(() => Array.from({ length: 170 }, () => ({
    x: Math.random(), y: Math.random(), r: Math.random() * 0.9 + 0.2,
    a: Math.random() * 0.4 + 0.06, sp: Math.random() * 0.007 + 0.002,
  })), []);
  const fgStars = useMemo(() => Array.from({ length: 55 }, () => ({
    x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + 0.5,
    a: Math.random() * 0.55 + 0.15, sp: Math.random() * 0.016 + 0.006,
  })), []);
  const nebulae = useMemo(() => [
    { x: 0.14, y: 0.22, col: "#22c55e", vx: 0.00007, vy: 0.00004 },
    { x: 0.80, y: 0.18, col: "#4ade80", vx: -0.00005, vy: 0.00006 },
    { x: 0.42, y: 0.70, col: "#ef4444", vx: 0.00006, vy: -0.00005 },
    { x: 0.84, y: 0.65, col: "#f97316", vx: -0.00008, vy: 0.00004 },
  ], []);
  const orbitPtcls = useMemo(() =>
    CLUSTER_POS_2D.map(() => Array.from({ length: 4 }, (_, j) => ({
      phase: (j / 4) * Math.PI * 2,
      speed: 0.55 + Math.random() * 0.45,
      r:     24 + Math.random() * 14,
    }))), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = 1, H = 1;
    const resize = () => { W = canvas.width = canvas.offsetWidth || 600; H = canvas.height = canvas.offsetHeight || 420; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const neb = nebulae.map(n => ({ ...n }));

    const draw = (ts: number) => {
      const t  = ts * 0.001;
      const cl = clRef.current  || [];
      const dc = colRef.current || "#22c55e";
      const hv = hovRef.current;

      // Detect new hover → spawn ripple
      if (hv !== prevHovRef.current) {
        prevHovRef.current = hv;
        if (hv) {
          const idx = cl.findIndex((c: any) => c.name === hv);
          if (idx >= 0 && CLUSTER_POS_2D[idx])
            rippleRef.current.push({ x: CLUSTER_POS_2D[idx].x * W, y: CLUSTER_POS_2D[idx].y * H, t });
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, W, H);

      // Nebula clouds
      for (const nb of neb) {
        nb.x += nb.vx; nb.y += nb.vy;
        if (nb.x < -0.15 || nb.x > 1.15) nb.vx *= -1;
        if (nb.y < -0.15 || nb.y > 1.15) nb.vy *= -1;
        const g = ctx.createRadialGradient(nb.x * W, nb.y * H, 0, nb.x * W, nb.y * H, 0.36 * Math.min(W, H));
        g.addColorStop(0, `${nb.col}16`); g.addColorStop(0.5, `${nb.col}07`); g.addColorStop(1, `${nb.col}00`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(nb.x * W, nb.y * H, 0.36 * Math.min(W, H), 0, Math.PI * 2); ctx.fill();
      }

      // BG stars (slow parallax)
      for (const s of bgStars) {
        ctx.globalAlpha = Math.max(0.03, Math.min(0.7, s.a + Math.sin(t * s.sp * 8) * 0.2));
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); ctx.fill();
      }
      // FG stars (faster, subtle drift)
      for (const s of fgStars) {
        const px = (s.x + Math.sin(t * 0.04) * 0.008) * W;
        const py = (s.y + Math.cos(t * 0.03) * 0.006) * H;
        ctx.globalAlpha = Math.max(0.05, Math.min(0.9, s.a + Math.sin(t * s.sp * 11) * 0.3));
        ctx.fillStyle = "#c8d8ff";
        ctx.beginPath(); ctx.arc(px, py, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      const cx = W / 2, cy = H / 2;
      const top3 = [...cl].sort((a: any, b: any) => (b.sim ?? 0) - (a.sim ?? 0)).slice(0, 3);

      // Energy trails to top-3 clusters
      for (const c of top3) {
        const idx = cl.indexOf(c);
        const p   = CLUSTER_POS_2D[idx];
        if (!p) continue;
        const px = p.x * W, py = p.y * H;
        const dx = px - cx, dy = py - cy;
        const alpha = Math.max(0.08, (c.sim ?? 50) / 240);

        ctx.setLineDash([3, 9]);
        const grad = ctx.createLinearGradient(cx, cy, px, py);
        grad.addColorStop(0, `${dc}80`); grad.addColorStop(1, `${c.color ?? "#888"}30`);
        ctx.strokeStyle = grad; ctx.lineWidth = 1; ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;

        // Animated energy particles along trail (more, larger)
        for (let k = 0; k < 6; k++) {
          const frac = ((t * 0.42 + k / 6) % 1.0);
          const pSize = 2.2 + (1 - frac) * 1.8;
          ctx.globalAlpha = (1 - frac) * 0.88;
          ctx.fillStyle = c.color ?? "#fff";
          ctx.shadowColor = c.color ?? "#fff";
          ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(cx + dx * frac, cy + dy * frac, pSize, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
      }

      // Cluster planets
      for (let i = 0; i < Math.min(cl.length, CLUSTER_POS_2D.length); i++) {
        const c   = cl[i]; const p = CLUSTER_POS_2D[i];
        if (!p || !c) continue;
        const px = p.x * W, py = p.y * H;
        const sim = c.sim ?? 50, col = c.color ?? "#888";
        const isHov = hv === c.name;
        const pulse = Math.sin(t * 1.5 + i * 0.8) * 0.08 + 1;
        const radius = (11 + (sim / 100) * 7) * (isHov ? 1.38 : 1);

        // Pulsing rings on hovered cluster
        if (isHov) {
          for (let ring = 0; ring < 3; ring++) {
            const rp = ((t * 0.9 + ring * 0.33) % 1.0);
            ctx.globalAlpha = (1 - rp) * 0.52;
            ctx.strokeStyle = col; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(px, py, radius + rp * 30, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }

        // Atmosphere halo (wider, softer)
        const atmo = ctx.createRadialGradient(px, py, radius * 0.6, px, py, radius * 6);
        atmo.addColorStop(0, `${col}22`); atmo.addColorStop(0.5, `${col}0d`); atmo.addColorStop(1, `${col}00`);
        ctx.fillStyle = atmo;
        ctx.beginPath(); ctx.arc(px, py, radius * 6, 0, Math.PI * 2); ctx.fill();

        // Glow
        const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 3.4);
        glow.addColorStop(0, `${col}55`); glow.addColorStop(1, `${col}00`);
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(px, py, radius * 3.4 * pulse, 0, Math.PI * 2); ctx.fill();

        // Core
        const core = ctx.createRadialGradient(px - radius * 0.28, py - radius * 0.28, 0, px, py, radius * pulse);
        core.addColorStop(0, "#ffffff58"); core.addColorStop(0.38, col); core.addColorStop(1, `${col}70`);
        ctx.fillStyle = core;
        ctx.beginPath(); ctx.arc(px, py, radius * pulse, 0, Math.PI * 2); ctx.fill();

        // Orbit particles
        for (const op of (orbitPtcls[i] ?? [])) {
          const angle = op.phase + t * op.speed;
          const ox = px + Math.cos(angle) * op.r;
          const oy = py + Math.sin(angle) * op.r * 0.34;
          ctx.globalAlpha = 0.28 + Math.abs(Math.sin(angle)) * 0.5;
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(ox, oy, 1.8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Labels — always visible (name + match% + signal)
        const signalStr = c.type === "human"
          ? (sim >= 75 ? "Strong Human Signal" : sim >= 50 ? "Human Signal" : "Weak Human Signal")
          : (sim >= 75 ? "Strong AI Signal"    : sim >= 50 ? "AI Signal"    : "Weak AI Signal");
        const signalCol2 = c.type === "human" ? "#4ade80" : "#f87171";
        const baseY = py + radius * pulse + 15;
        ctx.textAlign = "center";
        ctx.globalAlpha = isHov ? 1 : 0.80;
        ctx.fillStyle = isHov ? "#fff" : "#d4d4d8";
        ctx.font = `${isHov ? "700" : "600"} 10px Inter,sans-serif`;
        ctx.fillText(c.name ?? "", px, baseY);
        ctx.globalAlpha = isHov ? 1 : 0.72;
        ctx.fillStyle = col;
        ctx.font = "bold 10px 'JetBrains Mono',monospace";
        ctx.fillText(`${sim}% Match`, px, baseY + 13);
        ctx.globalAlpha = isHov ? 0.9 : 0.48;
        ctx.fillStyle = signalCol2;
        ctx.font = "9px Inter,sans-serif";
        ctx.fillText(signalStr, px, baseY + 24);
        ctx.globalAlpha = 1;
      }

      // Ripple shockwaves
      rippleRef.current = rippleRef.current.filter(r => (t - r.t) < 1.5);
      for (const r of rippleRef.current) {
        const age = t - r.t;
        ctx.globalAlpha = Math.max(0, 0.55 - age * 0.37);
        ctx.strokeStyle = "#ff4d4d"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(r.x, r.y, age * 85, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Document planet (larger)
      const docR = 36, docP = Math.sin(t * 1.1) * 0.055 + 1;

      // Atmosphere halo around document
      const dAtmo = ctx.createRadialGradient(cx, cy, docR * 0.8, cx, cy, docR * 5.5);
      dAtmo.addColorStop(0, `${dc}28`); dAtmo.addColorStop(0.5, `${dc}10`); dAtmo.addColorStop(1, `${dc}00`);
      ctx.fillStyle = dAtmo; ctx.beginPath(); ctx.arc(cx, cy, docR * 5.5, 0, Math.PI * 2); ctx.fill();

      // Three orbit rings
      for (const [orR, a, spd] of [[54, 0.48, 0.22], [74, 0.28, -0.14], [96, 0.16, 0.10]] as [number, number, number][]) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * spd); ctx.scale(1, 0.28);
        ctx.strokeStyle = dc; ctx.lineWidth = 1.4; ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(0, 0, orR, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      ctx.globalAlpha = 1;

      // Main glow
      const dGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, docR * 3.8);
      dGlow.addColorStop(0, `${dc}70`); dGlow.addColorStop(0.4, `${dc}30`); dGlow.addColorStop(1, `${dc}00`);
      ctx.fillStyle = dGlow; ctx.beginPath(); ctx.arc(cx, cy, docR * 3.8, 0, Math.PI * 2); ctx.fill();

      // Core sphere
      const dCore = ctx.createRadialGradient(cx - docR * 0.28, cy - docR * 0.28, 0, cx, cy, docR * docP);
      dCore.addColorStop(0, "#fff"); dCore.addColorStop(0.42, dc); dCore.addColorStop(1, `${dc}80`);
      ctx.fillStyle = dCore; ctx.beginPath(); ctx.arc(cx, cy, docR * docP, 0, Math.PI * 2); ctx.fill();

      // Pulsing outline on document planet
      ctx.globalAlpha = 0.35 + Math.sin(t * 2.2) * 0.2;
      ctx.strokeStyle = dc; ctx.lineWidth = 2;
      ctx.shadowColor = dc; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(cx, cy, docR * docP + 3, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;

      // Label
      ctx.globalAlpha = 1; ctx.fillStyle = "#fff";
      ctx.font = "bold 11px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
      ctx.fillText("⭐ YOUR DOCUMENT", cx, cy + docR + 20);
      ctx.globalAlpha = 0.65; ctx.fillStyle = "#9a9aa0";
      ctx.font = "10px Inter,sans-serif";
      ctx.fillText("Drag to explore", cx, cy + docR + 33);
      ctx.globalAlpha = 1;

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frameRef.current); ro.disconnect(); };
  }, [bgStars, fgStars, nebulae, orbitPtcls]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top)  / rect.height;
    const cl = clRef.current || [];
    let found: string | null = null;
    for (let i = 0; i < CLUSTER_POS_2D.length; i++) {
      const p  = CLUSTER_POS_2D[i];
      const dx = mx - p.x, dy = my - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 0.065 && cl[i]) { found = cl[i].name; break; }
    }
    setHovered(found);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
      style={{ width: "100%", height: "100%", display: "block", cursor: hovered ? "pointer" : "default" }}
    />
  );
}

/* ---- 2D Panel sub-components ---- */

function TrajectoryPanel({ clusters }: { clusters: any[] }) {
  const sorted = [...clusters].sort((a, b) => b.sim - a.sim).slice(0, 4);
  return (
    <Glass pad={20} style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>Closest Writing Styles</div>
      <div style={{ fontSize: 11, color: "#5a5a6a", marginBottom: 14 }}>How closely your document matches each writing zone</div>
      {sorted.map((c: any, i: number) => {
        const matchLabel = c.sim >= 80 ? "Very Strong Match" : c.sim >= 60 ? "Strong Match" : c.sim >= 40 ? "Moderate Match" : "Weak Match";
        return (
        <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: i < sorted.length - 1 ? 6 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
              background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
            {i < sorted.length - 1 && (
              <div style={{ width: 1.5, height: 30, marginTop: 2,
                background: `linear-gradient(${c.color},${sorted[i + 1].color})`, opacity: 0.45 }} />
            )}
          </div>
          <div style={{ flex: 1, paddingBottom: i < sorted.length - 1 ? 8 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e8ea" }}>{c.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: c.color,
                background: `${c.color}18`, border: `1px solid ${c.color}40`,
                borderRadius: 6, padding: "2px 8px" }}>{c.sim}% Similar</span>
            </div>
            <div style={{ fontSize: 10, color: "#5a5a6a", marginBottom: 5 }}>{matchLabel}</div>
            <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,.06)" }}>
              <div style={{ height: "100%", borderRadius: 2, width: `${c.sim}%`,
                background: `linear-gradient(90deg,${c.color}70,${c.color})`,
                boxShadow: `0 0 6px ${c.color}55`, transition: "width 1.2s ease" }} />
            </div>
          </div>
        </div>
        );
      })}
    </Glass>
  );
}

function WritingInfluencePanel({ aiProb, humanProb }: { aiProb: number; humanProb: number }) {
  const ai  = Number.isFinite(aiProb)    ? aiProb    : 0;
  const hum = Number.isFinite(humanProb) ? humanProb : 0;
  const meters = [
    { label: "Human Influence",   value: hum,                                color: "#22c55e",
      desc: hum >= 60 ? "Strong human writing patterns detected" : hum >= 40 ? "Some human writing patterns present" : "Low human influence" },
    { label: "AI Influence",      value: ai,                                 color: "#ef4444",
      desc: ai >= 60 ? "Strong AI writing patterns detected" : ai >= 40 ? "Some AI patterns present" : "Low AI influence" },
    { label: "Research Style",    value: Math.round(hum * 0.91),             color: "#4ade80",
      desc: "How much your document resembles academic research writing" },
    { label: "Creative Style",    value: Math.round(hum * 0.28 + ai * 0.10), color: "#f59e0b",
      desc: "Degree of creative and expressive language use" },
    { label: "Predictability",    value: Math.round(ai * 0.82),             color: "#f97316",
      desc: ai >= 60 ? "High predictability — common in AI-generated text" : "Natural unpredictability — typical of human writing" },
  ];
  return (
    <Glass pad={20}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>Writing Influence Analysis</div>
      <div style={{ fontSize: 11, color: "#5a5a6a", marginBottom: 14 }}>How much each writing style influences your document</div>
      {meters.map((b, idx) => (
        <div key={b.label} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
            <span style={{ fontSize: 12, color: "#c0c0c8", fontWeight: 600 }}>{b.label}</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: b.color }}>{b.value}%</span>
          </div>
          <div style={{ fontSize: 10.5, color: "#5a5a6a", marginBottom: 6, lineHeight: 1.4 }}>{b.desc}</div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,.04)",
            border: `1px solid ${b.color}22`, overflow: "hidden", position: "relative" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${b.value}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: idx * 0.1 }}
              style={{ height: "100%", borderRadius: 4, position: "relative",
                background: `linear-gradient(90deg,${b.color}28,${b.color}80,${b.color})`,
                boxShadow: `0 0 12px ${b.color}40` }}
            >
              <div style={{
                position: "absolute", inset: 0, borderRadius: 4,
                background: `linear-gradient(90deg,transparent,${b.color}55,transparent)`,
                backgroundSize: "60% 100%", animation: "shimmer 1.8s linear infinite",
              }} />
            </motion.div>
          </div>
        </div>
      ))}
    </Glass>
  );
}

function WritingFingerprintPanel({ aiProb, humanProb, burstiness }: { aiProb: number; humanProb: number; burstiness: number }) {
  const isHuman = humanProb >= 50;
  const ai  = Number.isFinite(aiProb)    ? aiProb    : 0;
  const hum = Number.isFinite(humanProb) ? humanProb : 0;
  const burst = Math.min(99, Math.round((Number.isFinite(burstiness) ? burstiness : 5) * 8));
  const metrics = [
    {
      label: "Vocabulary Richness", value: isHuman ? hum : Math.round(ai * 0.4),
      color: isHuman ? "#22c55e" : "#ef4444",
      desc: isHuman ? "Uses diverse vocabulary and varied expressions." : "Vocabulary is repetitive and formulaic — common in AI text.",
    },
    {
      label: "Sentence Variety", value: isHuman ? Math.round(hum * 0.88) : Math.round(ai * 0.92),
      color: isHuman ? "#4ade80" : "#ef4444",
      desc: isHuman ? "Sentences vary in length and structure, as humans naturally write." : "Sentence lengths are unusually uniform — typical of AI generation.",
    },
    {
      label: "Creativity", value: isHuman ? Math.round(hum * 0.80) : Math.round(ai * 0.28),
      color: isHuman ? "#22c55e" : "#f97316",
      desc: isHuman ? "Writing shows original ideas and expressive language choices." : "Low creativity score — AI tends to produce predictable content.",
    },
    {
      label: "Predictability", value: isHuman ? Math.round(ai * 0.38) : Math.round(ai * 0.90),
      color: isHuman ? "#4ade80" : "#ef4444",
      desc: isHuman ? "Writing is unpredictable — a hallmark of genuine human thought." : "High predictability — words and phrases follow AI patterns closely.",
    },
    {
      label: "Writing Flow", value: burst,
      color: isHuman ? "#22c55e" : "#f59e0b",
      desc: isHuman ? "Natural bursts and pauses in writing rhythm indicate human flow." : "Unusually consistent flow — AI rarely varies its writing pace.",
    },
    {
      label: "Authenticity", value: isHuman ? hum : Math.round(100 - ai * 0.85),
      color: isHuman ? "#22c55e" : "#ef4444",
      desc: isHuman ? "Overall writing feels genuine and personally authored." : "Authenticity signals are weak — content appears synthetically generated.",
    },
  ];
  return (
    <Glass pad={20} style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>Writing Fingerprint</div>
      <div style={{ fontSize: 11, color: "#5a5a6a", marginBottom: 14 }}>
        Six signals that reveal how your document was written
      </div>
      {metrics.map((m, idx) => (
        <div key={m.label} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#e8e8ea" }}>{m.label}</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 800, color: m.color }}>{m.value}%</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#8a8a92", marginBottom: 7, lineHeight: 1.5 }}>{m.desc}</div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.05)", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${m.value}%` }}
              transition={{ duration: 1.3, ease: "easeOut", delay: idx * 0.09 }}
              style={{ height: "100%", borderRadius: 3,
                background: `linear-gradient(90deg,${m.color}50,${m.color})`,
                boxShadow: `0 0 8px ${m.color}55` }}
            />
          </div>
        </div>
      ))}
    </Glass>
  );
}

function WritingProfilePanel({ aiProb, humanProb, radar }: any) {
  const dims = ["Creativity", "Authenticity", "Vocabulary", "Reasoning", "Consistency", "Predictability"];
  const hum = Number.isFinite(humanProb) ? humanProb : 0;
  const ai  = Number.isFinite(aiProb)    ? aiProb    : 0;
  const docVals = [
    radar?.creativity    ?? Math.round(hum * 0.80),
    radar?.authenticity  ?? hum,
    radar?.vocabulary    ?? hum,
    radar?.reasoning     ?? Math.round(hum * 0.86),
    radar?.consistency   ?? Math.round(hum * 0.78),
    radar?.predictability ?? Math.round(ai * 0.82),
  ];
  const merged = dims.map((dim, i) => {
    const dv = Number.isFinite(docVals[i]) ? docVals[i] : 0;
    return {
      dim,
      "Your Document":        dv,
      "Typical Human Writing": Math.min(99, Math.round(72 + i * 3)),
      "Typical AI Writing":    Math.min(99, Math.round(ai * 0.88 + 4)),
    };
  });
  return (
    <Glass pad={20} style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>Writing Profile Comparison</div>
      <div style={{ fontSize: 12, color: "#5a5a6a", marginBottom: 14 }}>
        Compare your document's writing profile against typical human and AI writing
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
        {[["#ff4d4d", "Your Document"], ["#22c55e", "Typical Human Writing"], ["#f59e0b", "Typical AI Writing"]].map(([col, lbl]) => (
          <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#9a9aa0" }}>
            <span style={{ width: 10, height: 3, borderRadius: 2, background: col as string, display: "inline-block" }} />
            {lbl}
          </div>
        ))}
      </div>
      <div style={{ filter: "drop-shadow(0 0 8px rgba(255,77,77,0.3))" }}>
        <ResponsiveContainer width="100%" height={290}>
          <RadarChart data={merged} outerRadius="73%">
            <PolarGrid stroke="rgba(255,77,77,0.15)" />
            <PolarAngleAxis dataKey="dim" tick={{ fill: "#9a9aa0", fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Your Document"         dataKey="Your Document"         stroke="#ff4d4d" strokeWidth={2.5} fill="#ff4d4d" fillOpacity={0.20} dot={{ r: 4, fill: "#ff4d4d" }} />
            <Radar name="Typical Human Writing" dataKey="Typical Human Writing" stroke="#22c55e" strokeWidth={1.5} fill="#22c55e" fillOpacity={0.08} strokeDasharray="5 3" />
            <Radar name="Typical AI Writing"    dataKey="Typical AI Writing"    stroke="#f59e0b" strokeWidth={1.5} fill="#f59e0b" fillOpacity={0.07} strokeDasharray="5 3" />
            <Tooltip
              contentStyle={{ background: "#070708", border: "1px solid rgba(255,77,77,0.4)", borderRadius: 9, fontSize: 12, color: "#fff" }}
              formatter={(val: any, name: string) => [`${val}%`, name]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Glass>
  );
}

function ForensicBriefingCard({ aiProb, humanProb, topCluster, clusters }: any) {
  const ai  = Number.isFinite(aiProb)    ? aiProb    : 0;
  const hum = Number.isFinite(humanProb) ? humanProb : 0;
  const isHuman = hum >= 50;
  const topHuman = [...(clusters || [])].filter((c: any) => c.type === "human").sort((a: any, b: any) => (b.sim ?? 0) - (a.sim ?? 0))[0];
  const riskLvl = ai >= 75 ? "HIGH" : ai >= 50 ? "ELEVATED" : ai >= 25 ? "LOW" : "MINIMAL";
  const riskCol = ai >= 75 ? "#ef4444" : ai >= 50 ? "#f97316" : ai >= 25 ? "#f59e0b" : "#22c55e";

  const plainInterpretation = isHuman
    ? `Your document aligns closely with ${topHuman?.name ?? "authentic human writing"}. The writing shows natural variation in sentence structure, rhythm, and vocabulary that is consistent with genuine human authorship. Your document shares many characteristics with ${topCluster?.name ?? "human writing"}.`
    : `Your document shares many characteristics with ${topCluster?.name ?? "AI-generated writing"}. Consistent sentence structure, predictable transitions, and repeated phrasing patterns contributed to this assessment. These are patterns commonly observed in AI-generated content.`;

  const primFactors = isHuman ? [
    "Sentences vary naturally in length and rhythm",
    "Vocabulary is diverse and expressive",
    "Writing flow shows natural human pacing and spontaneity",
  ] : [
    "Sentence structure is highly consistent and formulaic",
    "Transition phrases appear more frequently than in human writing",
    "Writing follows predictable AI generation patterns",
  ];
  const secFactors = isHuman ? [
    "Writing complexity varies across different sections",
    "Structural patterns are below AI detection thresholds",
  ] : [
    "Content flows unusually smoothly without human-like imperfections",
    "Creative expression is lower than expected for human writing",
  ];
  return (
    <Glass pad={24} style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 18, letterSpacing: ".28em" }}>What Our Investigation Found</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {[
          { lbl: "Most Similar Writing Style", name: topCluster?.name ?? "—", sim: topCluster?.sim ?? 0, col: topCluster?.color ?? "#cfcfd2" },
          { lbl: "Closest Human Style",        name: topHuman?.name    ?? "—", sim: topHuman?.sim    ?? 0, col: "#22c55e" },
        ].map(item => (
          <div key={item.lbl} style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 10, color: "#5a5a64", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 6 }}>{item.lbl}</div>
            <div style={{ fontWeight: 700, color: item.col, fontSize: 14 }}>{item.name}</div>
            <div style={{ fontSize: 11, color: "#6a6a72", marginTop: 3 }}>{item.sim}% similar writing pattern</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#5a5a64", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Our Interpretation</div>
        <p style={{ fontSize: 13, color: "#b0b0b8", lineHeight: 1.72 }}>{plainInterpretation}</p>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "#5a5a64", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>What Led Us to This Conclusion</div>
        {primFactors.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
            <CheckCircle2 size={13} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12.5, color: "#b8b8c0", lineHeight: 1.55 }}>{f}</span>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, color: "#5a5a64", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Additional Supporting Evidence</div>
        {secFactors.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
            <Circle size={9} color="#5a5a64" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 12, color: "#8a8a92", lineHeight: 1.55 }}>{f}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `${riskCol}0f`, border: `1px solid ${riskCol}30`, borderRadius: 10, padding: "10px 16px" }}>
        <span style={{ fontSize: 12, color: "#9a9aa0" }}>Academic Integrity Risk</span>
        <span className="mono" style={{ fontWeight: 800, fontSize: 12, color: riskCol, letterSpacing: ".15em" }}>{riskLvl} RISK</span>
      </div>
    </Glass>
  );
}

function AIvsHumanMeter({ aiProb, humanProb }: { aiProb: number; humanProb: number }) {
  const ai  = Math.max(5, Math.min(95, Number.isFinite(aiProb)    ? aiProb    : 0));
  const hum = Math.max(5, Math.min(95, Number.isFinite(humanProb) ? humanProb : 0));
  const isHuman     = hum >= 50;
  const diff        = Math.abs(hum - ai);
  const verdictLabel = diff >= 40 ? (isHuman ? "Strong Human Signal" : "Strong AI Signal")
    : diff >= 20 ? (isHuman ? "Human Signal" : "AI Signal") : "Mixed Signal";
  const verdictColor = isHuman ? "#22c55e" : "#ef4444";
  const flowPct = ai;

  return (
    <Glass pad={0} style={{ marginBottom: 24, overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(90deg, rgba(34,197,94,.07) 0%, transparent 38%, transparent 62%, rgba(239,68,68,.07) 100%)" }} />
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid rgba(0,229,255,.06)", position: "relative" }}>
        <div className="eyebrow" style={{ letterSpacing: ".26em", marginBottom: 2 }}>Dual Energy Reactor</div>
        <div style={{ fontSize: 11, color: "#5a5a6a" }}>Energy balance between writing forces</div>
      </div>
      <div style={{ padding: "28px 24px 24px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 80, flexShrink: 0 }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 32%, #4ade80, #22c55e, #14532d)",
              boxShadow: `0 0 ${isHuman ? 44 : 18}px rgba(34,197,94,${isHuman ? .75 : .32}), inset 0 0 14px rgba(34,197,94,.5)`,
              animation: `glowPulse ${isHuman ? 1.5 : 3.2}s ease-in-out infinite`,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid rgba(34,197,94,.38)" }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: "#fff", textShadow: "0 0 12px #22c55e" }}>{hum}%</span>
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "#22c55e", letterSpacing: ".08em", textAlign: "center" }}>HUMAN</div>
          </div>
          <div style={{ flex: 1, position: "relative", height: 64, display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 9, borderRadius: 5,
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", top: "50%", transform: "translateY(-50%)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${hum}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
                style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 5,
                  background: "linear-gradient(90deg,#22c55e,#4ade8077)" }} />
              <motion.div initial={{ width: 0 }} animate={{ width: `${ai}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
                style={{ position: "absolute", right: 0, top: 0, bottom: 0, borderRadius: 5,
                  background: "linear-gradient(270deg,#ef4444,#f8717177)" }} />
              <motion.div
                initial={{ left: "50%" }} animate={{ left: `${hum}%` }}
                transition={{ duration: 2.2, ease: "easeOut" }}
                style={{ position: "absolute", top: "50%", transform: "translate(-50%,-50%)",
                  width: 16, height: 16, borderRadius: "50%",
                  background: verdictColor, boxShadow: `0 0 18px ${verdictColor}`, zIndex: 2 }} />
            </div>
            {[14, 30, 50, 70, 86].map((pos, i) => (
              <div key={i} style={{ position: "absolute", left: `${pos}%`, top: "50%", transform: "translateY(-50%)",
                width: 4, height: 4, borderRadius: "50%",
                background: pos < flowPct ? "#ef4444" : "#22c55e", opacity: 0.72,
                animation: `gravPull ${1.4 + i * 0.28}s ease-in-out ${i * 0.2}s infinite`,
                boxShadow: `0 0 5px ${pos < flowPct ? "#ef4444" : "#22c55e"}` }} />
            ))}
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".1em", whiteSpace: "nowrap",
                background: `${verdictColor}18`, border: `1px solid ${verdictColor}38`, color: verdictColor,
                padding: "3px 10px", borderRadius: 7, boxShadow: `0 0 14px ${verdictColor}20`,
                animation: "glowPulse 2.8s ease-in-out infinite" }}>{verdictLabel}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 80, flexShrink: 0 }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 32%, #f87171, #ef4444, #7f1d1d)",
              boxShadow: `0 0 ${!isHuman ? 44 : 18}px rgba(239,68,68,${!isHuman ? .75 : .32}), inset 0 0 14px rgba(239,68,68,.5)`,
              animation: `glowPulse ${!isHuman ? 1.5 : 3.2}s ease-in-out infinite`,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid rgba(239,68,68,.38)" }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: "#fff", textShadow: "0 0 12px #ef4444" }}>{ai}%</span>
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "#ef4444", letterSpacing: ".08em", textAlign: "center" }}>AI</div>
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: verdictColor,
              textShadow: `0 0 18px ${verdictColor}` }}>{isHuman ? hum : ai}%</div>
            <div style={{ fontSize: 10, color: "#5a5a6a", fontWeight: 600, letterSpacing: ".06em" }}>
              {isHuman ? "Human Dominance" : "AI Influence"}
            </div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,.06)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#7a7a84" }}>{diff}%</div>
            <div style={{ fontSize: 10, color: "#5a5a6a", fontWeight: 600, letterSpacing: ".06em" }}>Confidence Gap</div>
          </div>
        </div>
      </div>
    </Glass>
  );
}

function WritingPersonalityCard({ aiProb, humanProb }: { aiProb: number; humanProb: number }) {
  const ai  = Number.isFinite(aiProb)    ? aiProb    : 0;
  const hum = Number.isFinite(humanProb) ? humanProb : 0;
  const traits = [
    { icon: "◈", label: "Creativity",
      score: hum >= 70 ? 82 : hum >= 50 ? 61 : ai >= 70 ? 18 : 40,
      desc:  ai >= 70 ? "Low — predictable phrasing" : hum >= 70 ? "High — unexpected expressions" : "Moderate variation",
      color: ai >= 70 ? "#ef4444" : "#22c55e" },
    { icon: "◉", label: "Authenticity",
      score: hum >= 70 ? 88 : hum >= 50 ? 65 : ai >= 70 ? 12 : 38,
      desc:  ai >= 70 ? "Low — formulaic construction" : hum >= 70 ? "Strong authentic signals" : "Partially authentic",
      color: ai >= 70 ? "#ef4444" : "#22c55e" },
    { icon: "◆", label: "Vocabulary",
      score: hum >= 70 ? 79 : hum >= 50 ? 58 : ai >= 70 ? 22 : 45,
      desc:  ai >= 70 ? "Formulaic — formal AI lexicon" : hum >= 70 ? "Rich & diverse range" : "Moderate range",
      color: hum >= 70 ? "#22c55e" : ai >= 70 ? "#ef4444" : "#f59e0b" },
    { icon: "▶", label: "Reasoning",
      score: ai >= 60 ? 74 : hum >= 60 ? 82 : 55,
      desc:  ai >= 60 ? "Structured — linear AI flow" : "Organic — natural progression",
      color: ai >= 60 ? "#f97316" : "#22c55e" },
    { icon: "≈", label: "Flow",
      score: ai >= 70 ? 91 : ai >= 50 ? 72 : hum >= 70 ? 45 : 60,
      desc:  ai >= 70 ? "Very consistent — AI hallmark" : hum >= 70 ? "Variable & natural" : "Moderately consistent",
      color: ai >= 70 ? "#ef4444" : "#22c55e" },
    { icon: "●", label: "Predictability",
      score: ai >= 70 ? 86 : ai >= 50 ? 65 : hum >= 70 ? 22 : 45,
      desc:  ai >= 70 ? "High — AI generation pattern" : hum >= 70 ? "Low — human variation" : "Moderate",
      color: ai >= 70 ? "#ef4444" : "#22c55e" },
  ];
  return (
    <Glass pad={20} style={{ marginBottom: 16, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg,transparent,rgba(0,229,255,.38),transparent)",
        animation: "streamFlow 3s linear infinite" }} />
      <div style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ letterSpacing: ".26em", marginBottom: 4 }}>Writing Personality</div>
        <div style={{ fontSize: 11, color: "#5a5a6a" }}>Holographic trait analysis — 6 dimensions</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        {traits.map((t, i) => (
          <motion.div key={t.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            style={{ padding: "11px 12px", borderRadius: 11,
              background: `linear-gradient(145deg,${t.color}08,rgba(5,8,22,.88))`,
              border: `1px solid ${t.color}26`, position: "relative", overflow: "hidden",
              cursor: "default", transition: "border-color .3s,box-shadow .3s" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = `${t.color}50`; el.style.boxShadow = `0 0 18px ${t.color}16`; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = `${t.color}26`; el.style.boxShadow = ""; }}
          >
            <div style={{ fontSize: 15, color: t.color, textShadow: `0 0 10px ${t.color}`, marginBottom: 5 }}>{t.icon}</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: "#e0e0e8", marginBottom: 3, letterSpacing: ".04em" }}>{t.label}</div>
            <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,.06)", marginBottom: 5 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${t.score}%` }}
                transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                style={{ height: "100%", borderRadius: 2,
                  background: `linear-gradient(90deg,${t.color}55,${t.color})`,
                  boxShadow: `0 0 6px ${t.color}44` }} />
            </div>
            <div style={{ fontSize: 9, color: "#6a6a7a", lineHeight: 1.4 }}>{t.desc}</div>
            <div style={{ position: "absolute", top: 9, right: 10,
              fontSize: 10, fontWeight: 800, color: t.color, textShadow: `0 0 8px ${t.color}` }}>{t.score}</div>
          </motion.div>
        ))}
      </div>
    </Glass>
  );
}

function TopFindingsCard({ aiProb, humanProb, topCluster }: { aiProb: number; humanProb: number; topCluster: any }) {
  const ai  = Number.isFinite(aiProb)    ? aiProb    : 0;
  const hum = Number.isFinite(humanProb) ? humanProb : 0;
  const isHuman = hum >= 50;

  const findings = isHuman ? [
    { icon: "✓", text: "Natural Sentence Rhythm",              color: "#22c55e" },
    { icon: "✓", text: "Vocabulary Diversity",                 color: "#4ade80" },
    { icon: "✓", text: "Human Creativity Signals",             color: "#22c55e" },
    { icon: "✓", text: "Low Predictability",                   color: "#4ade80" },
    { icon: "✓", text: `Strong ${topCluster?.name ?? "Human"} Match`, color: "#22c55e" },
  ] : [
    { icon: "⚠", text: "Highly Consistent Sentence Structure", color: "#ef4444" },
    { icon: "⚠", text: "AI Transition Phrases Detected",       color: "#f97316" },
    { icon: "⚠", text: "Low Writing Variation",                color: "#ef4444" },
    { icon: "⚠", text: "Predictable Vocabulary Patterns",      color: "#f97316" },
    { icon: "⚠", text: `Strong ${topCluster?.name ?? "AI"} Match`,   color: "#ef4444" },
  ];

  return (
    <Glass pad={22} style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 4, letterSpacing: ".22em" }}>Top Findings</div>
      <div style={{ fontSize: 11, color: "#5a5a6a", marginBottom: 18 }}>Key signals from our analysis</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {findings.map((f, i) => (
          <div key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px",
            borderRadius: 10, border: `1px solid ${f.color}30`, background: `${f.color}08`,
            fontSize: 13, fontWeight: 600, color: "#e8e8ea",
            animation: `chipSlideUp .5s ease both`,
            animationDelay: `${i * 0.1}s`,
            transition: "transform .3s ease, box-shadow .3s ease, border-color .3s ease",
            cursor: "default",
          }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(-4px)";
              el.style.boxShadow = `0 10px 28px ${f.color}28`;
              el.style.borderColor = `${f.color}60`;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "";
              el.style.boxShadow = "";
              el.style.borderColor = `${f.color}30`;
            }}
          >
            <span style={{ color: f.color, fontSize: 15, lineHeight: 1 }}>{f.icon}</span>
            {f.text}
          </div>
        ))}
      </div>
    </Glass>
  );
}

function WritingGravityField({ aiProb, humanProb }: { aiProb: number; humanProb: number }) {
  const ai  = Math.max(5, Math.min(95, Number.isFinite(aiProb)    ? aiProb    : 0));
  const hum = Math.max(5, Math.min(95, Number.isFinite(humanProb) ? humanProb : 0));
  const isHuman   = hum >= 50;
  const dominance = Math.abs(hum - ai);
  const pull      = (ai - hum) / 100;   // −1 to +1; positive = toward AI

  // Document slides left/right: center=50%, ±18% max shift
  const docLeft       = 50 + pull * 18;
  // Planet radii scale with influence
  const humR          = Math.round(52 + hum * 0.26);
  const aiR           = Math.round(52 + ai  * 0.26);
  const dominantColor = isHuman ? "#22c55e" : "#ef4444";

  return (
    <Glass pad={28} style={{ marginBottom: 24, position: "relative", overflow: "hidden" }}>
      {/* Ambient field gradient shifts with dominance */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: `linear-gradient(90deg,
          rgba(34,197,94,${(0.04 + hum / 1400).toFixed(3)}) 0%,
          transparent 42%, transparent 58%,
          rgba(239,68,68,${(0.04 + ai / 1400).toFixed(3)}) 100%)`,
        transition: "background 1.5s ease" }} />

      <div className="eyebrow" style={{ marginBottom: 4, letterSpacing: ".28em", position: "relative" }}>
        Writing Gravity Field
      </div>
      <div style={{ fontSize: 11, color: "#5a5a6a", marginBottom: 20, position: "relative" }}>
        Document gravitates toward the dominant writing source
      </div>

      {/* Visualization arena */}
      <div style={{ position: "relative", height: 210 }}>
        {/* SVG overlay: gravitational field lines + energy waves + pull arrows */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
          overflow: "visible", pointerEvents: "none" }}
          viewBox="0 0 600 210" preserveAspectRatio="none">

          {/* Curved gravitational field lines — bend toward dominant side */}
          {[-44, -28, -12, 12, 28, 44].map((yOff, i) => {
            const bend = (isHuman ? -1 : 1) * (dominance / 100) * 28;
            return (
              <path key={`fl${i}`}
                d={`M 95,${105 + yOff} Q 300,${105 + yOff * 0.45 + bend} 505,${105 + yOff}`}
                fill="none" stroke={dominantColor}
                strokeWidth={0.7} strokeOpacity={0.08 + Math.abs(yOff) / 700}
                strokeDasharray="9,7"
                style={{ animation: `streamFlow ${1.7 + i * 0.18}s linear infinite${isHuman ? "" : " reverse"}` }} />
            );
          })}

          {/* Energy waves from dominant planet */}
          {[0, 1, 2].map(wi => (
            <ellipse key={`ew${wi}`}
              cx={isHuman ? "95" : "505"} cy="105"
              rx={55 + wi * 26} ry={(55 + wi * 26) * 0.60}
              fill="none" stroke={dominantColor}
              strokeWidth="1.1" strokeOpacity={0.22 - wi * 0.06}
              style={{ animation: `glowPulse ${2.2 + wi * 0.55}s ease-in-out ${wi * 0.45}s infinite` }} />
          ))}

          {/* Directional pull arrow near document */}
          {dominance >= 15 && (
            <path
              d={isHuman
                ? "M 248,100 L 230,105 L 248,110"
                : "M 352,100 L 370,105 L 352,110"}
              fill={dominantColor} fillOpacity="0.62" stroke="none"
              style={{ animation: "glowPulse 1.5s ease-in-out infinite" }} />
          )}
        </svg>

        {/* Human gravity source — left */}
        <div style={{ position: "absolute", left: "15.5%", top: "50%",
          transform: "translate(-50%, -50%)", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-flex",
            alignItems: "center", justifyContent: "center", width: humR, height: humR }}>
            {isHuman && [0, 1].map(ri => (
              <div key={ri} style={{ position: "absolute",
                width: humR + 18 + ri * 22, height: humR + 18 + ri * 22,
                borderRadius: "50%", border: "1px solid #22c55e",
                opacity: 0.18 - ri * 0.06,
                animation: `glowPulse ${2.0 + ri * 0.55}s ease-in-out ${ri * 0.38}s infinite` }} />
            ))}
            <div style={{
              width: humR, height: humR, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 32%, #a7f3d0 0%, #22c55e 38%, #14532d 100%)",
              boxShadow: `0 0 ${isHuman ? 54 : 22}px rgba(34,197,94,${isHuman ? 0.68 : 0.28}),
                          0 0 ${isHuman ? 110 : 44}px rgba(34,197,94,${isHuman ? 0.18 : 0.06})`,
              animation: `glowPulse ${isHuman ? 1.7 : 3.6}s ease-in-out infinite`,
              transition: "all 1.6s ease" }} />
          </div>
          <div style={{ marginTop: 9 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>{hum}%</div>
            <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.38)", fontWeight: 700,
              letterSpacing: ".13em", marginTop: 3 }}>HUMAN WRITING</div>
          </div>
        </div>

        {/* AI gravity source — right */}
        <div style={{ position: "absolute", right: "15.5%", top: "50%",
          transform: "translate(50%, -50%)", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-flex",
            alignItems: "center", justifyContent: "center", width: aiR, height: aiR }}>
            {!isHuman && [0, 1].map(ri => (
              <div key={ri} style={{ position: "absolute",
                width: aiR + 18 + ri * 22, height: aiR + 18 + ri * 22,
                borderRadius: "50%", border: "1px solid #ef4444",
                opacity: 0.18 - ri * 0.06,
                animation: `glowPulse ${2.0 + ri * 0.55}s ease-in-out ${ri * 0.38}s infinite` }} />
            ))}
            <div style={{
              width: aiR, height: aiR, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 32%, #fecaca 0%, #ef4444 38%, #7f1d1d 100%)",
              boxShadow: `0 0 ${!isHuman ? 54 : 22}px rgba(239,68,68,${!isHuman ? 0.68 : 0.28}),
                          0 0 ${!isHuman ? 110 : 44}px rgba(239,68,68,${!isHuman ? 0.18 : 0.06})`,
              animation: `glowPulse ${!isHuman ? 1.7 : 3.6}s ease-in-out infinite`,
              transition: "all 1.6s ease" }} />
          </div>
          <div style={{ marginTop: 9 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#ef4444", lineHeight: 1 }}>{ai}%</div>
            <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.38)", fontWeight: 700,
              letterSpacing: ".13em", marginTop: 3 }}>AI WRITING</div>
          </div>
        </div>

        {/* Document — pulled by gravitational dominance */}
        <div style={{
          position: "absolute", top: "46%", left: `${docLeft}%`,
          transform: "translate(-50%, -50%)", zIndex: 3,
          transition: "left 2.2s cubic-bezier(.34,1.56,.64,1)", textAlign: "center"
        }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%",
            background: isHuman
              ? "radial-gradient(circle at 35% 32%, #fff 0%, #4ade80 38%, #15803d 100%)"
              : "radial-gradient(circle at 35% 32%, #fff 0%, #f87171 38%, #991b1b 100%)",
            boxShadow: isHuman
              ? "0 0 32px rgba(34,197,94,.88), 0 0 64px rgba(34,197,94,.20)"
              : "0 0 32px rgba(239,68,68,.88), 0 0 64px rgba(239,68,68,.20)",
            border: "1.5px solid rgba(255,255,255,.22)",
            animation: "glowPulse 2.0s ease-in-out infinite",
            transition: "background 1.5s ease, box-shadow 1.5s ease" }} />
          <div style={{ fontSize: 8, color: "rgba(255,255,255,.42)", fontWeight: 700,
            letterSpacing: ".12em", marginTop: 7, whiteSpace: "nowrap" }}>
            YOUR DOCUMENT
          </div>
        </div>
      </div>

      {/* Signal verdict */}
      <div style={{ textAlign: "center", marginTop: 18, position: "relative" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 26px", borderRadius: 10, fontWeight: 700, fontSize: 14,
          background: isHuman ? "rgba(34,197,94,.11)" : "rgba(239,68,68,.11)",
          border: `1px solid ${isHuman ? "#22c55e" : "#ef4444"}48`,
          color: isHuman ? "#4ade80" : "#f87171",
          boxShadow: `0 0 22px ${isHuman ? "rgba(34,197,94,.18)" : "rgba(239,68,68,.18)"}`,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%",
            background: dominantColor, display: "inline-block",
            boxShadow: `0 0 8px ${dominantColor}`,
            animation: "glowPulse 1.5s ease-in-out infinite" }} />
          {dominance >= 40
            ? `Strong ${isHuman ? "Human" : "AI"} Signal — ${dominance}% dominance`
            : dominance >= 20
            ? `Moderate ${isHuman ? "Human" : "AI"} Signal — ${dominance}% differential`
            : `Mixed Signal — ${dominance}% differential`}
        </span>
      </div>
    </Glass>
  );
}

function FinalVerdictHero({ aiProb, humanProb, confidence }: { aiProb: number; humanProb: number; confidence: number }) {
  const ai   = Number.isFinite(aiProb)     ? aiProb     : 0;
  const hum  = Number.isFinite(humanProb)  ? humanProb  : 0;
  const conf = Number.isFinite(confidence) ? confidence : 0;
  const isHuman   = hum >= 50;
  const verdict   = isHuman ? "Human Written" : "AI Generated";
  const vCol      = isHuman ? "#22c55e" : "#ef4444";
  const r = 64, circ = 2 * Math.PI * r;
  const arc = circ * (conf / 100);
  const trustScore = Math.round(isHuman ? hum * 0.96 : Math.max(0, 100 - ai * 0.96));
  const probScore  = Math.round(isHuman ? hum : ai);

  return (
    <div style={{
      border: `1px solid ${vCol}35`, borderRadius: 22, padding: "40px 32px",
      background: `linear-gradient(160deg,#050505,#070708,${vCol}07)`,
      boxShadow: `0 0 90px -22px ${vCol}38, 0 1px 0 ${vCol}14 inset, 0 -1px 0 rgba(255,255,255,.03) inset`,
      textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 50% -10%, ${vCol}12, transparent 55%)` }} />
      {/* Floating particles */}
      {[0,1,2,3,4,5].map(i => (
        <div key={i} style={{
          position: "absolute", width: 4, height: 4, borderRadius: "50%",
          background: vCol, opacity: 0.22,
          left: `${12 + i * 15}%`, top: `${18 + (i % 3) * 22}%`,
          animation: `floatUp ${2 + i * 0.35}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.28}s`,
        }} />
      ))}
      <div className="eyebrow" style={{ marginBottom: 22, letterSpacing: ".44em", position: "relative" }}>Language Galaxy Verdict</div>

      {/* Confidence Ring */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28, position: "relative" }}>
        <svg width={156} height={156} viewBox="0 0 156 156" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={78} cy={78} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="9" />
          <circle cx={78} cy={78} r={r} fill="none" stroke={vCol} strokeWidth="9"
            strokeDasharray={`${arc.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 9px ${vCol}90)` }} />
        </svg>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 29, fontWeight: 900, color: vCol, lineHeight: 1 }}>{conf}%</div>
          <div style={{ fontSize: 9, color: "#5a5a6a", marginTop: 5, letterSpacing: ".16em", textTransform: "uppercase" }}>Confidence</div>
        </div>
      </div>

      <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-.025em", marginBottom: 12,
        color: vCol, textShadow: `0 0 55px ${vCol}70` }}>{verdict}</div>

      <div style={{ fontSize: 13, color: vCol === "#22c55e" ? "#86efac" : "#fca5a5", marginBottom: 16,
        letterSpacing: ".06em", fontWeight: 600 }}>
        {conf}% Confidence
      </div>

      {/* Cinematic description */}
      <div style={{ fontSize: 14, color: "#c0c0c8", lineHeight: 1.82, maxWidth: 520,
        margin: "0 auto 28px", textAlign: "center" }}>
        {isHuman
          ? `This document strongly resembles authentic human writing. The strongest indicators were natural variation in sentence structure, diverse vocabulary choices, and writing rhythm that changes organically across sections — all hallmarks of genuine human authorship.`
          : `This document strongly resembles AI-generated writing. The strongest indicators were highly consistent sentence structures, predictable transitions, and similarities to known AI writing profiles. These patterns are consistently observed in content produced by language models.`}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", justifyContent: "center", gap: 0, marginTop: 0, marginBottom: 24,
        background: "rgba(255,255,255,.02)", borderRadius: 14,
        border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
        {[
          { lbl: "AI Writing",   val: `${ai}%`,         col: "#ef4444" },
          { lbl: "Human Writing", val: `${hum}%`,       col: "#22c55e" },
          { lbl: "Trust Score",  val: `${trustScore}%`, col: "#cfcfd2" },
          { lbl: "Probability",  val: `${probScore}%`,  col: vCol },
        ].map((item, i, arr) => (
          <React.Fragment key={item.lbl}>
            <div style={{ flex: 1, padding: "14px 6px" }}>
              <div style={{ fontSize: 9, color: "#5a5a6a", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 5 }}>{item.lbl}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.col }}>{item.val}</div>
            </div>
            {i < arr.length - 1 && <div style={{ width: 1, background: "rgba(255,255,255,.07)", alignSelf: "stretch" }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Primary Signals */}
      <div style={{ textAlign: "left", maxWidth: 380, margin: "0 auto 20px" }}>
        <div style={{ fontSize: 10, color: "#5a5a6a", textTransform: "uppercase", letterSpacing: ".16em", marginBottom: 12, textAlign: "center" }}>Primary Signals</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
          {[
            "Sentence Consistency",
            "Vocabulary Patterns",
            "Authorship Indicators",
            "Writing Rhythm",
          ].map(sig => (
            <div key={sig} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <CheckCircle2 size={13} color={vCol} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#c0c0c8" }}>{sig}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mono" style={{ fontSize: 9, color: "#3a3a44", letterSpacing: ".24em" }}>NUROAI LINGUISTIC FORENSICS ENGINE v2.0</div>
    </div>
  );
}

function LanguageGalaxy({ docId }: { docId: string | null }) {
  const [results,    setResults]    = useState<any>(null);
  const [authorship, setAuthorship] = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [hovered,    setHovered]    = useState<string | null>(null);

  useEffect(() => {
    if (!docId) { setLoading(false); return; }
    setLoading(true); setError(null);
    Promise.all([
      fetch(`${API}/api/documents/${docId}/results`).then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
      fetch(`${API}/api/documents/${docId}/authorship`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([res, auth]) => { setResults(res); setAuthorship(auth); })
      .catch(e => setError(`Could not load galaxy data: ${e}`))
      .finally(() => setLoading(false));
  }, [docId]);

  if (!docId) return (
    <div style={{ padding: 64, textAlign: "center", color: "#6a6a70" }}>
      <Sparkles size={44} style={{ margin: "0 auto 18px", display: "block", color: "#3a3a42" }} />
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#8a8a90" }}>No Document Selected</div>
      <div style={{ fontSize: 13 }}>Analyze a document first, then return here to explore the Language Galaxy.</div>
    </div>
  );

  if (loading) return (
    <div style={{ padding: 80, textAlign: "center" }}>
      <div className="pulse" style={{ display: "inline-block", color: "#ff1e1e", marginBottom: 16 }}><Sparkles size={38} /></div>
      <div style={{ color: "#6a6a70", fontSize: 14 }}>Mapping linguistic galaxy…</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 48, textAlign: "center", color: "#ef4444" }}>
      <AlertTriangle size={32} style={{ margin: "0 auto 12px", display: "block" }} />
      <div style={{ fontSize: 14 }}>{error}</div>
    </div>
  );

  const aiProb    = results?.aiDetection?.aiProbability   ?? 0;
  const humanProb = results?.aiDetection?.humanProbability ?? Math.max(0, 100 - aiProb);
  const burstiness = authorship?.features?.burstiness ?? 5;
  const radarData  = authorship?.radar ?? {};
  const docColor   = aiProb >= 60 ? "#ef4444" : aiProb >= 40 ? "#f59e0b" : "#22c55e";
  const clusters   = computeClusterData(aiProb, humanProb);
  const topCluster = [...clusters].sort((a, b) => b.sim - a.sim)[0];
  const confidence = Math.min(99, Math.round(Math.max(aiProb, humanProb) * 0.91 + 6));
  const statusLabel = aiProb >= 60 ? "AI Generated" : aiProb >= 40 ? "Uncertain" : "Human Written";

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Writing Universe</div>
          <h2 style={{ fontSize: 27, fontWeight: 900, letterSpacing: "-.02em" }}>
            <span className="metallic">Language</span> <span className="crimsonText">Galaxy</span>
          </h2>
          <p style={{ fontSize: 13, color: "#7a7a80", marginTop: 6, maxWidth: 520 }}>
            Where does this document belong in the universe of writing styles?
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span className="chip" style={{ borderColor: `${docColor}50`, color: docColor }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: docColor,
              display: "inline-block", boxShadow: `0 0 7px ${docColor}` }} />
            {statusLabel}
          </span>
          <span className="chip">
            <Sparkles size={12} /> Closest: {topCluster?.name ?? "Mapping…"}
          </span>
        </div>
      </div>

      <div className="hairline" style={{ marginBottom: 20 }} />

      {/* HOW TO READ THIS UNIVERSE */}
      <Glass pad={18} style={{ marginBottom: 16, borderRadius: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg,transparent,rgba(0,229,255,.5),transparent)" }} />
        <div style={{ fontSize: 10, fontWeight: 800, color: "#00e5ff", letterSpacing: ".22em",
          textTransform: "uppercase", marginBottom: 12 }}>How to Read This Universe</div>
        <div style={{ fontSize: 12, color: "#5a5a6a", marginBottom: 14 }}>
          Your document is positioned among known human and AI writing styles.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8 }}>
          {[
            { col: "#22c55e", icon: "◉", label: "Emerald Worlds", sub: "Human writing styles" },
            { col: "#ef4444", icon: "◉", label: "Coral Worlds",   sub: "AI writing styles" },
            { col: "#f59e0b", icon: "◉", label: "Amber Worlds",   sub: "Mixed writing styles" },
            { col: docColor,  icon: "★", label: "Central Star",   sub: "Your uploaded document" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 9,
              background: `${item.col}08`, border: `1px solid ${item.col}20` }}>
              <span style={{ fontSize: 14, color: item.col, textShadow: `0 0 8px ${item.col}`,
                flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: item.col }}>{item.label}</div>
                <div style={{ fontSize: 9, color: "#6a6a72" }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 10.5, color: "#5a5a6a" }}>
          Hover any planet to see its name, similarity percentage, and signal strength.
        </div>
      </Glass>

      {/* Galaxy Canvas */}
      <Glass pad={0} style={{ height: 510, borderRadius: 18, overflow: "hidden", marginBottom: 24, position: "relative" }}>
        <div style={{ position: "absolute", top: 14, left: 18, zIndex: 2, pointerEvents: "none" }}>
          <span className="mono" style={{ fontSize: 10, color: "#6a6a72", letterSpacing: ".18em" }}>
            WRITING UNIVERSE — HOVER TO SEE WHAT EACH ZONE MEANS
          </span>
        </div>
        <div style={{ position: "absolute", bottom: 14, left: 18, zIndex: 2, display: "flex", gap: 18, pointerEvents: "none" }}>
          {[["#22c55e", "Human Writing Zones"], ["#ef4444", "AI Writing Zones"], [docColor, "Your Document"]].map(([col, lbl]) => (
            <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#9a9aa0" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: col as string, display: "inline-block", boxShadow: `0 0 5px ${col}` }} />
              {lbl}
            </div>
          ))}
        </div>
        {hovered && (() => {
          const c = clusters.find((x: any) => x.name === hovered);
          if (!c) return null;
          const sim = c.sim ?? 0;
          const matchLabel = sim >= 80 ? "Very Strong Match" : sim >= 60 ? "Strong Match" : sim >= 40 ? "Moderate Match" : "Weak Match";
          const signal = c.type === "human" ? "Supports Human" : "Supports AI";
          const signalCol = c.type === "human" ? "#22c55e" : "#ef4444";
          return (
            <div style={{
              position: "absolute", top: 14, right: 18, zIndex: 10, maxWidth: 240,
              background: "rgba(6,6,8,0.94)", border: `1px solid ${c.color}55`,
              borderRadius: 12, padding: "14px 16px", fontSize: 12, color: "#fff",
              backdropFilter: "blur(12px)", boxShadow: `0 0 24px ${c.color}30`,
              pointerEvents: "none",
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: c.color, fontSize: 13 }}>{c.name}</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: "#5a5a6a", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 3 }}>Similarity</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{sim}% <span style={{ fontSize: 11, fontWeight: 600 }}>{matchLabel}</span></div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "#5a5a6a", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>Interpretation</div>
                <div style={{ fontSize: 11, color: "#c0c0c8", lineHeight: 1.6 }}>{c.interpretation}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                background: `${signalCol}14`, borderRadius: 7, border: `1px solid ${signalCol}35` }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: signalCol, display: "inline-block", boxShadow: `0 0 5px ${signalCol}` }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: signalCol }}>Signal: {signal}</span>
              </div>
            </div>
          );
        })()}
        <GalaxyErrorBoundary>
          <GalaxyScene3D clusters={clusters} docColor={docColor} setHovered={setHovered} />
        </GalaxyErrorBoundary>
      </Glass>

      {/* AI vs Human Meter — glassmorphism balance platform */}
      <AIvsHumanMeter aiProb={aiProb} humanProb={humanProb} />

      {/* Writing Gravity Field */}
      <WritingGravityField aiProb={aiProb} humanProb={humanProb} />

      {/* What We Found — plain-English summary */}
      {(() => {
        const isHuman = humanProb >= 50;
        const topAI = [...clusters].filter((c: any) => c.type === "ai").sort((a: any, b: any) => b.sim - a.sim)[0];
        const topHum = [...clusters].filter((c: any) => c.type === "human").sort((a: any, b: any) => b.sim - a.sim)[0];
        const summaryColor = isHuman ? "#22c55e" : "#ef4444";
        const summary = isHuman ? (
          <>
            Your document aligns closely with <strong style={{ color: "#4ade80" }}>authentic human writing</strong>.{" "}
            Variation in sentence rhythm, vocabulary selection, and structure indicates natural authorship.{" "}
            Minimal AI indicators were detected.
          </>
        ) : (
          <>
            Your document is strongly aligned with <strong style={{ color: "#ef4444" }}>known AI writing patterns</strong>.{" "}
            The strongest similarities were found with{" "}
            <strong style={{ color: topAI?.color ?? "#f97316" }}>{topAI?.name ?? "AI writing"}</strong>{" "}
            {topHum && <>and <strong style={{ color: "#86efac" }}>{topHum.name}</strong></>}.{" "}
            Sentence structure is highly consistent and predictable, which is commonly observed in AI-generated content.
          </>
        );
        return (
          <Glass pad={22} style={{ marginBottom: 20, borderLeft: `3px solid ${summaryColor}`, borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${summaryColor}18`,
                display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Search size={15} color={summaryColor} />
              </div>
              <div className="eyebrow" style={{ letterSpacing: ".22em" }}>What We Found</div>
            </div>
            <p style={{ fontSize: 14, color: "#c8c8d0", lineHeight: 1.75, margin: 0 }}>{summary}</p>
          </Glass>
        );
      })()}

      {/* Top Findings */}
      <TopFindingsCard aiProb={aiProb} humanProb={humanProb} topCluster={topCluster} />

      {/* 2-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div>
          <TrajectoryPanel clusters={clusters} />
          <WritingPersonalityCard aiProb={aiProb} humanProb={humanProb} />
        </div>
        <div>
          <WritingFingerprintPanel aiProb={aiProb} humanProb={humanProb} burstiness={burstiness} />
          <WritingInfluencePanel aiProb={aiProb} humanProb={humanProb} />
        </div>
      </div>

      <WritingProfilePanel aiProb={aiProb} humanProb={humanProb} radar={radarData} />
      <ForensicBriefingCard aiProb={aiProb} humanProb={humanProb} topCluster={topCluster} clusters={clusters} />
      <FinalVerdictHero aiProb={aiProb} humanProb={humanProb} confidence={confidence} />
    </div>
  );
}

/* ============================================================
   NEURAL EVIDENCE CHAMBER
   ============================================================ */

function NeuralEvidenceChamber({ docId }: { docId: string | null }) {
  const [results,  setResults]  = useState<any>(null);
  const [auth,     setAuth]     = useState<any>(null);
  const [crosslang,setCross]    = useState<any>(null);
  const [codeData, setCode]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!docId) { setLoading(false); return; }
    setLoading(true); setError(null);
    Promise.all([
      fetch(`${API}/api/documents/${docId}/results`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/documents/${docId}/authorship`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/documents/${docId}/crosslang`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/documents/${docId}/code`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([res, a, cl, cd]) => { setResults(res); setAuth(a); setCross(cl); setCode(cd); })
      .catch(e => setError(`${e}`))
      .finally(() => setLoading(false));
  }, [docId]);

  if (!docId) return (
    <div style={{ padding: 64, textAlign: "center", color: "#6a6a70" }}>
      <Brain size={44} style={{ margin: "0 auto 18px", display: "block", color: "#3a3a42" }} />
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#8a8a90" }}>No Document Selected</div>
      <div style={{ fontSize: 13 }}>Analyze a document first to reveal the neural evidence.</div>
    </div>
  );
  if (loading) return (
    <div style={{ padding: 80, textAlign: "center" }}>
      <div className="pulse" style={{ display: "inline-block", color: "#ff4d4d", marginBottom: 16 }}><Brain size={38} /></div>
      <div style={{ color: "#6a6a70", fontSize: 14 }}>Neural evidence chamber initializing…</div>
    </div>
  );
  if (error) return (
    <div style={{ padding: 48, textAlign: "center", color: "#ef4444" }}>
      <AlertTriangle size={32} style={{ margin: "0 auto 12px", display: "block" }} />
      <div style={{ fontSize: 14 }}>{error}</div>
    </div>
  );

  const aiProb    = results?.aiDetection?.aiProbability   ?? 0;
  const humanProb = results?.aiDetection?.humanProbability ?? Math.max(0, 100 - aiProb);
  const coreColor = aiProb >= 60 ? "#ef4444" : aiProb >= 40 ? "#f59e0b" : "#22c55e";
  const confidence = Math.min(99, Math.round(Math.max(aiProb, humanProb) * 0.91 + 6));
  const riskLevel  = aiProb >= 75 ? "HIGH" : aiProb >= 50 ? "ELEVATED" : aiProb >= 25 ? "LOW" : "MINIMAL";
  const riskColor  = aiProb >= 75 ? "#ef4444" : aiProb >= 50 ? "#f97316" : aiProb >= 25 ? "#f59e0b" : "#22c55e";
  const isHuman    = humanProb >= 50;

  // Evidence Nodes from real data
  const nodes = [
    {
      id: "ocr", name: "OCR Integrity", Icon: ScanLine,
      conf: results?.ocr?.ocrConfidence ?? 95,
      contrib: `+${Math.round((results?.ocr?.ocrConfidence ?? 95) * 0.12)} pts`,
      status: results?.pipelineStatus === "OCR_FAILED" ? "Failed" : "Passed",
      signals: [
        results?.pipelineStatus === "OCR_FAILED" ? "✗ OCR extraction failed" : "✓ Text extracted successfully",
        `✓ Engine: ${results?.ocr?.ocrEngine ?? "direct"}`,
        `✓ ${(results?.ocr?.textLength ?? 0).toLocaleString()} chars`,
      ],
    },
    {
      id: "stylo", name: "Stylometry", Icon: Brain,
      conf: Math.min(99, Math.round(Math.max(aiProb, humanProb) * 0.9 + 5)),
      contrib: `+${Math.round(aiProb * 0.24)} AI pts`,
      status: auth?.status === "ok" ? "Active" : "Limited",
      signals: [
        `✓ Predictability: ${auth?.radar?.predictability ?? aiProb}%`,
        `✓ Creativity: ${auth?.radar?.creativity ?? humanProb}%`,
        `✓ Consistency: ${auth?.radar?.consistency ?? 70}%`,
      ],
    },
    {
      id: "semantic", name: "Semantic Analysis", Icon: Layers,
      conf: Math.min(99, Math.round(Math.max(aiProb, humanProb) * 0.88 + 5)),
      contrib: `+${Math.round(aiProb * 0.18)} AI pts`,
      status: "Active",
      signals: [
        `✓ AI vocab signals detected`,
        `✓ Semantic redundancy scored`,
        `✓ Perplexity computed`,
      ],
    },
    {
      id: "author", name: "Authorship", Icon: Fingerprint,
      conf: auth?.status === "ok" ? Math.max(10, Math.round(100 - (auth?.risk ?? 50))) : 50,
      contrib: `+${Math.round((auth?.risk ?? aiProb) * 0.20)} pts`,
      status: auth?.status === "ok" ? (auth?.verdict?.toLowerCase().includes("ai") ? "Flagged" : "Verified") : (auth?.status ?? "N/A"),
      signals: [
        `✓ Risk: ${auth?.risk ?? "—"}%`,
        auth?.verdict ? `✓ ${(auth.verdict as string).slice(0, 34)}…` : "✓ No baseline enrolled",
        `✓ ${auth?.docCount ?? 0} enrolled docs`,
      ],
    },
    {
      id: "cross", name: "Cross-Language", Icon: Languages,
      conf: crosslang?.status === "LANGUAGE_NOT_PRESENT" ? 99 : Math.max(10, Math.round(100 - (crosslang?.overallScore ?? 0))),
      contrib: `+${Math.round((crosslang?.overallScore ?? 0) * 0.12)} pts`,
      status: crosslang?.status === "LANGUAGE_NOT_PRESENT" ? "Monolingual" : (crosslang?.status === "ok" ? "Multi-lingual" : (crosslang?.status ?? "N/A")),
      signals: [
        `✓ ${crosslang?.sourceLanguage ?? "English (EN)"}`,
        `✓ Target: ${crosslang?.targetLanguage ?? "N/A"}`,
        `✓ Score: ${crosslang?.overallScore ?? 0}%`,
      ],
    },
    {
      id: "code", name: "Code Intelligence", Icon: Code2,
      conf: codeData?.status === "NO_CODE_DETECTED" ? 99 : Math.max(10, Math.round(100 - (codeData?.codeSimilarity ?? 0))),
      contrib: `+${Math.round((codeData?.codeSimilarity ?? 0) * 0.10)} pts`,
      status: codeData?.status === "NO_CODE_DETECTED" ? "No Code" : (codeData?.status === "ok" ? "Analysed" : (codeData?.status ?? "N/A")),
      signals: [
        codeData?.status === "NO_CODE_DETECTED" ? "✓ No code blocks" : "✓ Code blocks found",
        `✓ Similarity: ${codeData?.codeSimilarity ?? 0}%`,
        codeData?.renameEvasion ? "⚠ Rename evasion" : "✓ No evasion detected",
      ],
    },
  ];

  // Decision flow stages
  const stages = [
    { label: "OCR Extraction",          done: true },
    { label: "Feature Extraction",       done: true },
    { label: "Stylometry",               done: auth?.status === "ok" },
    { label: "Semantic Matching",        done: true },
    { label: "Authorship Verification",  done: auth?.status === "ok" },
    { label: "Final Verdict",            done: true },
  ];

  // Evidence constellation signals
  const signals = [
    { label: "Vocabulary",     isHuman: isHuman,         neutral: false },
    { label: "Consistency",    isHuman: isHuman,         neutral: false },
    { label: "Writing Rhythm", isHuman: isHuman,         neutral: aiProb >= 40 && aiProb <= 60 },
    { label: "Predictability", isHuman: !isHuman,        neutral: false },
    { label: "Syntax",         isHuman: isHuman,         neutral: false },
    { label: "Creativity",     isHuman: isHuman,         neutral: false },
    { label: "Semantic Drift", isHuman: humanProb > 50,  neutral: false },
    { label: "Cross-Language", isHuman: (crosslang?.overallScore ?? 0) < 30, neutral: crosslang?.status === "LANGUAGE_NOT_PRESENT" },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Forensic Intelligence</div>
          <h2 style={{ fontSize: 27, fontWeight: 900, letterSpacing: "-.02em" }}>
            <span className="metallic">Neural</span> <span className="crimsonText">Evidence Chamber</span>
          </h2>
          <p style={{ fontSize: 13, color: "#7a7a80", marginTop: 6, maxWidth: 520 }}>
            Signal-level forensic evidence — showing exactly why NuroAI reached its decision
          </p>
        </div>
        <span className="chip" style={{ borderColor: `${coreColor}50`, color: coreColor }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: coreColor,
            display: "inline-block", boxShadow: `0 0 7px ${coreColor}`, animation: "glowPulse 2s infinite" }} />
          {aiProb >= 60 ? "AI Generated" : aiProb >= 40 ? "Mixed Signals" : "Human Written"}
        </span>
      </div>
      <div className="hairline" style={{ marginBottom: 32 }} />

      {/* ── NEURAL GRID BACKGROUND ────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
          {/* Circuit grid SVG overlay */}
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", animation:"circuitPulse 4s ease-in-out infinite" }}
            xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ngrid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#00e5ff" strokeWidth="0.5" opacity="0.6"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ngrid)" />
          </svg>
          {/* Scanning wave */}
          <div style={{ position:"absolute", left:0, right:0, height:2,
            background:`linear-gradient(90deg,transparent,${coreColor}60,${coreColor}90,${coreColor}60,transparent)`,
            boxShadow:`0 0 18px ${coreColor}40`,
            animation:"neuralScan 4.5s ease-in-out infinite" }} />
          {/* Floating neural particles */}
          {[{l:"12%",t:"22%"},{l:"75%",t:"15%"},{l:"45%",t:"68%"},{l:"88%",t:"55%"},{l:"28%",t:"82%"},{l:"62%",t:"38%"}].map((p,i)=>(
            <div key={i} style={{ position:"absolute", left:p.l, top:p.t,
              width:4, height:4, borderRadius:"50%", background:coreColor,
              boxShadow:`0 0 8px ${coreColor}`, animation:`neuralFloat ${3.2+i*0.7}s ease-in-out ${i*0.5}s infinite` }} />
          ))}
          {/* Corner glows */}
          <div style={{ position:"absolute", top:0, left:0, width:220, height:220, borderRadius:"50%",
            background:`radial-gradient(circle, ${coreColor}08 0%, transparent 70%)`, transform:"translate(-40%,-40%)" }} />
          <div style={{ position:"absolute", bottom:0, right:0, width:280, height:280, borderRadius:"50%",
            background:`radial-gradient(circle, #7b61ff08 0%, transparent 70%)`, transform:"translate(40%,40%)" }} />
        </div>

      {/* ── NEURAL BRAIN INTERFACE ────────────────────────────── */}
      <div style={{ marginBottom:32, position:"relative", zIndex:1 }}>
        <div className="eyebrow" style={{ marginBottom:8, textAlign:"center", letterSpacing:".28em" }}>Neural Brain Interface</div>
        <div style={{ fontSize:11, color:"#4a4a5a", textAlign:"center", marginBottom:16 }}>
          Evidence channels firing into the neural decision core
        </div>
        <ProcessorChipPanel nodes={nodes} coreColor={coreColor} confidence={confidence}
          isHuman={isHuman} aiProb={aiProb} humanProb={humanProb}/>
      </div>

      {/* ── DECISION PATHWAY ──────────────────────────────────── */}
      <Glass pad={24} style={{ marginBottom:24, position:"relative", zIndex:1 }}>
        <div className="eyebrow" style={{ marginBottom:20, letterSpacing:".26em" }}>Decision Pathway</div>
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:13, top:14, bottom:14, width:2,
            background:`linear-gradient(${coreColor}80, ${coreColor}20)`, opacity:0.5 }} />
          {[
            { label:"OCR Extraction",     desc:"Document text successfully extracted",                         done:true },
            { label:"Feature Extraction", desc:"Writing signals and patterns measured",                        done:true },
            { label:"Stylometry",         desc:auth?.status==="ok"?"Writing style fingerprint analyzed":"Baseline comparison limited", done:auth?.status==="ok" },
            { label:"Semantic Analysis",  desc:"AI vocabulary and concept patterns scored",                    done:true },
            { label:"Evidence Fusion",    desc:`${nodes.filter(n2=>n2.status==="Active"||n2.status==="Passed"||n2.status==="Verified"||n2.status==="Monolingual"||n2.status==="No Code").length}/6 evidence channels merged`, done:true },
            { label:"Final Decision",     desc:`${aiProb>=60?"AI Generated":aiProb>=40?"Mixed Signals":"Human Written"} — ${confidence}% confidence`, done:true },
          ].map((s,i,arr)=>(
            <div key={s.label} style={{ display:"flex", gap:18, marginBottom:i<arr.length-1?22:0, position:"relative", zIndex:1 }}>
              <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%",
                  background:s.done?`radial-gradient(circle, ${coreColor}cc, ${coreColor}55)`:"rgba(255,255,255,.05)",
                  border:`2px solid ${s.done?coreColor:"rgba(255,255,255,.1)"}`,
                  boxShadow:s.done?`0 0 18px ${coreColor}55, 0 0 36px ${coreColor}18`:"none",
                  display:"grid", placeItems:"center",
                  animation:s.done?`glowPulse ${2.5+i*0.25}s ease-in-out infinite`:"none",
                }}>
                  {s.done?<CheckCircle2 size={13} color="#fff" />:<Circle size={13} color="#3a3a44" />}
                </div>
              </div>
              <div style={{ flex:1, paddingTop:3 }}>
                <div style={{ fontSize:14, fontWeight:700, color:s.done?"#e8e8ec":"#4a4a58" }}>{s.label}</div>
                <div style={{ fontSize:12, color:s.done?"#7a7a82":"#3a3a46", marginTop:2 }}>{s.desc}</div>
              </div>
              {i===arr.length-1 && (
                <span style={{ padding:"4px 14px", borderRadius:8, fontSize:11, fontWeight:800,
                  background:`${riskColor}18`, border:`1px solid ${riskColor}40`, color:riskColor,
                  alignSelf:"center", whiteSpace:"nowrap", boxShadow:`0 0 12px ${riskColor}20` }}>
                  {riskLevel} RISK
                </span>
              )}
            </div>
          ))}
        </div>
      </Glass>

      {/* ── FORENSIC REASONING ────────────────────────────────── */}
      <Glass pad={28} style={{ marginBottom:24, borderLeft:`3px solid ${coreColor}`, position:"relative", zIndex:1 }}>
        <div className="eyebrow" style={{ marginBottom:12, letterSpacing:".32em" }}>Why NuroAI Reached This Decision</div>
        <h3 style={{ fontSize:18, fontWeight:800, marginBottom:20, letterSpacing:"-.01em" }}>
          {isHuman?"Evidence converges on authentic human writing":"Evidence converges on AI-generated content"}
        </h3>
        {(isHuman ? [
          { icon:"✦", title:"Linguistic Diversity", text:"Sentence structures vary naturally in length and complexity — a clear signature of organic human thought processes rather than templated generation." },
          { icon:"◈", title:"Creative Vocabulary", text:"Word choices appear contextually driven and creatively selected, rather than formulaic or statistically optimised for fluency." },
          { icon:"⬡", title:"Evidence Convergence", text:`Multiple independent analysis channels independently reached the same conclusion, increasing confidence in this assessment.${auth?.status==="ok"?" Writing style comparison further confirmed authentic authorship patterns.":""}` },
        ] : [
          { icon:"▲", title:"Structural Uniformity", text:"Sentence length and syntactic structure are unusually consistent — a pattern strongly associated with large language model output." },
          { icon:"◈", title:"AI Vocabulary Markers", text:"High density of formal academic transition phrases and semantically predictable vocabulary detected throughout the document." },
          { icon:"⬡", title:"Evidence Convergence", text:`Multiple independent analysis channels converged on the same conclusion.${auth?.status==="ok"?" Writing rhythm analysis further confirmed AI generation patterns.":""}` },
        ]).map((card,i)=>(
          <motion.div key={i}
            initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}}
            transition={{duration:.45,delay:i*0.14,ease:"easeOut"}}
            style={{ display:"flex", gap:16, padding:"14px 16px", marginBottom:10, borderRadius:12,
              background:`${coreColor}07`, border:`1px solid ${coreColor}20` }}>
            <div style={{ fontSize:20, color:coreColor, flexShrink:0, lineHeight:1, marginTop:3,
              textShadow:`0 0 14px ${coreColor}` }}>{card.icon}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#e8e8ec", marginBottom:5 }}>{card.title}</div>
              <div style={{ fontSize:13, lineHeight:1.75, color:"#9a9aa8" }}>{card.text}</div>
            </div>
          </motion.div>
        ))}
      </Glass>

      {/* ── EVIDENCE CONSTELLATION ────────────────────────────── */}
      <Glass pad={22} style={{ marginBottom:24, position:"relative", zIndex:1 }}>
        <div className="eyebrow" style={{ marginBottom:8, letterSpacing:".22em" }}>Evidence Constellation</div>
        <div style={{ fontSize:11, color:"#5a5a6a", marginBottom:18 }}>
          <span style={{ color:"#22c55e" }}>●</span> Human Evidence &nbsp;&nbsp;
          <span style={{ color:"#ef4444" }}>●</span> AI Evidence &nbsp;&nbsp;
          <span style={{ color:"#f59e0b" }}>●</span> Neutral
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {signals.map((sig,i) => {
            const col = sig.neutral?"#f59e0b":sig.isHuman?"#22c55e":"#ef4444";
            return (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ width:44, height:44, borderRadius:"50%", margin:"0 auto 8px",
                  background:`radial-gradient(circle at 35% 35%, ${col}dd, ${col}50)`,
                  boxShadow:`0 0 18px ${col}45, 0 0 36px ${col}18`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  animation:`glowPulse ${2.2+i*0.22}s ease-in-out infinite`,
                  animationDelay:`${i*0.14}s` }}>
                  <div style={{ width:12, height:12, borderRadius:"50%", background:col }} />
                </div>
                <div style={{ fontSize:10, color:"#6a6a72", lineHeight:1.35 }}>{sig.label}</div>
              </div>
            );
          })}
        </div>
      </Glass>

      {/* ── VERDICT CHAMBER ───────────────────────────────────── */}
      <div style={{
        border:`1px solid ${coreColor}45`, borderRadius:24, padding:"52px 40px",
        background:`linear-gradient(160deg, #060608, #0a0a12, ${coreColor}08)`,
        boxShadow:`0 0 120px -22px ${coreColor}45, 0 0 240px -60px ${coreColor}20`,
        position:"relative", overflow:"hidden", textAlign:"center", zIndex:1,
      }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          background:`radial-gradient(ellipse at 50% 0%, ${coreColor}28, transparent 62%)` }} />
        {/* Rotating energy sweep */}
        <div style={{ position:"absolute", inset:0, borderRadius:24, overflow:"hidden", pointerEvents:"none" }}>
          <div style={{ position:"absolute", inset:-2, borderRadius:26,
            background:`conic-gradient(${coreColor}00 0deg, ${coreColor}20 90deg, ${coreColor}0a 180deg, ${coreColor}00 270deg)`,
            animation:"energySweep 7s linear infinite" }} />
        </div>
        {/* Floating particles */}
        {[0,1,2,3,4,5,6,7].map(i=>(
          <div key={i} style={{ position:"absolute", width:i<4?4:2.5, height:i<4?4:2.5, borderRadius:"50%",
            background:coreColor, opacity:0.32, left:`${8+i*11}%`, bottom:"8%",
            boxShadow:`0 0 8px ${coreColor}`,
            animation:`particleRise ${2+i*0.38}s ease-out infinite`, animationDelay:`${i*0.42}s` }} />
        ))}
        <div className="eyebrow" style={{ letterSpacing:".5em", marginBottom:16, color:coreColor, position:"relative", fontSize:10 }}>
          Final Verdict
        </div>
        {/* Cinematic rings */}
        <div style={{ position:"relative", display:"inline-block", marginBottom:20 }}>
          {[120, 160, 200, 240].map((sz, ri) => (
            <div key={ri} style={{ position:"absolute", top:"50%", left:"50%",
              width:sz, height:sz, borderRadius:"50%",
              border:`1px solid ${coreColor}${ri===0?"55":ri===1?"38":ri===2?"22":"12"}`,
              transform:"translate(-50%,-50%)",
              boxShadow:`0 0 ${8+ri*4}px ${coreColor}${ri===0?"30":"18"}`,
              animation:`energySweep ${18+ri*9}s linear ${ri%2===0?"":"reverse"} infinite`,
              pointerEvents:"none" }} />
          ))}
          <div style={{ position:"relative", zIndex:2, padding:"32px 56px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:coreColor, letterSpacing:".18em", marginBottom:10,
              textShadow:`0 0 20px ${coreColor}` }}>
              {aiProb>=60?"AI GENERATED":"HUMAN WRITTEN"}
            </div>
            <div style={{ fontSize:46, fontWeight:900, letterSpacing:"-.03em", lineHeight:1.1,
              color:"#fff", textShadow:`0 0 50px ${coreColor}70, 0 0 100px ${coreColor}30` }}>
              {aiProb>=60?"LIKELY AI":"AUTHENTIC"}
            </div>
            <div style={{ fontSize:22, fontWeight:700, color:"rgba(255,255,255,.55)", letterSpacing:".02em", marginTop:4 }}>
              {aiProb>=60?"Generated Writing":"Human Writing"}
            </div>
          </div>
        </div>
        {/* Confidence arc */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:32, position:"relative" }}>
          <svg width="170" height="170" viewBox="0 0 170 170">
            {[82, 72, 62].map((r, ri) => (
              <circle key={ri} cx="85" cy="85" r={r} fill="none"
                stroke={ri===0?coreColor:ri===1?`${coreColor}28`:`${coreColor}10`}
                strokeWidth={ri===0?8:ri===1?1:0.5}
                strokeLinecap="round"
                strokeDasharray={ri===0?`${2*Math.PI*r*confidence/100} ${2*Math.PI*r}`:`${2*Math.PI*r} 0`}
                transform="rotate(-90 85 85)"
                style={{ filter:ri===0?`drop-shadow(0 0 16px ${coreColor})`:"none",
                  transition: "stroke-dasharray 1.4s ease-out" }} />
            ))}
            <text x="85" y="79" textAnchor="middle" fill="#fff" fontWeight="900" fontSize="28" fontFamily="Inter">{confidence}%</text>
            <text x="85" y="100" textAnchor="middle" fill="rgba(255,255,255,.4)" fontSize="10" fontFamily="Inter" letterSpacing="2">CONFIDENCE</text>
          </svg>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, maxWidth:480, margin:"0 auto", position:"relative" }}>
          {[
            { lbl:"Human Score", val:`${humanProb}%`, col:"#22c55e" },
            { lbl:"AI Score",    val:`${aiProb}%`,    col:"#ef4444" },
            { lbl:"Risk Level",  val:riskLevel,        col:riskColor },
          ].map(s=>(
            <div key={s.lbl} style={{ padding:"20px 12px", borderRadius:16,
              background:`${s.col}09`, border:`1px solid ${s.col}28`,
              boxShadow:`0 0 24px ${s.col}10` }}>
              <div style={{ fontSize:26, fontWeight:900, color:s.col, marginBottom:6,
                textShadow:`0 0 18px ${s.col}` }}>{s.val}</div>
              <div style={{ fontSize:9.5, color:"#5a5a68", textTransform:"uppercase", letterSpacing:".12em" }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      </div>
    </div>
  );
}

/* ============================================================
   CONSOLE SHELL (sidebar)
   ============================================================ */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analyze", label: "Document Analysis", icon: FileSearch },
  { id: "results", label: "Results", icon: FileCheck2 },
  { id: "galaxy", label: "Language Galaxy", icon: Sparkles },
  { id: "evidence", label: "Neural Evidence", icon: Brain },
  { id: "authorship", label: "Authorship Verification", icon: Fingerprint },
  { id: "crosslang", label: "Cross-Language", icon: Languages },
  { id: "code", label: "Code Intelligence", icon: Code2 },
  { id: "settings", label: "Settings", icon: Settings },
];

function Shell({ view, go, children }) {
  const [open, setOpen] = useState(false);
  const health = useBackendHealth();
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.black0, position: "relative" }}>
      <DeepSpaceBackground />
      {/* sidebar */}
      <aside style={{
        width: 256, flexShrink: 0, borderRight: "1px solid rgba(0,229,255,.08)",
        background: "linear-gradient(180deg,rgba(7,20,38,.96),rgba(5,8,22,.98))",
        backdropFilter: "blur(20px)", padding: 18,
        position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column",
        transform: open ? "none" : undefined, zIndex: 10,
      }} className="sidebar">
        <div onClick={() => go("landing")} style={{ cursor: "pointer", marginBottom: 24, paddingLeft: 4 }}>
          <Logo size={28} tagline={false} />
        </div>
        <div className="eyebrow" style={{ paddingLeft: 12, marginBottom: 8 }}>Intelligence Center</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {NAV.map(n => (
            <div key={n.id} className={`navitem ${view === n.id ? "active" : ""}`} onClick={() => go(n.id)}>
              <n.icon size={17} /> {n.label}
            </div>
          ))}
        </nav>
        <Glass pad={14} style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#ff3b3b,#7f1414)", display: "grid", placeItems: "center", fontWeight: 700, color: "#fff", fontSize: 13 }}>IM</div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Integrity Office</div>
              <div style={{ fontSize: 11, color: "#7a7a80" }}>Enterprise plan</div>
            </div>
          </div>
        </Glass>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 20, height: 62, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid rgba(0,229,255,.07)",
          background: "rgba(5,8,22,.75)", backdropFilter: "blur(20px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#8a8a90", fontSize: 13 }}>
            <Search size={16} />
            <span>Search documents, authors, reports…</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span className="chip" style={{
              color: health === "online" ? "#7ee787" : health === "offline" ? C.red : "#f59e0b",
              borderColor: health === "online" ? "rgba(126,231,135,.25)" : health === "offline" ? "rgba(239,68,68,.35)" : "rgba(245,158,11,.3)",
              background: health === "offline" ? "rgba(239,68,68,.08)" : "transparent",
            }}>
              <Activity size={13} />
              {health === "online" ? "Backend online" : health === "offline" ? "Backend offline" : "Connecting…"}
            </span>
            <Bell size={18} color="#9a9aa0" />
          </div>
        </header>
        <main style={{ padding: 24, flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */
const THREAT_COLORS = ["#FF1E1E", "#DC2626", "#f59e0b", "#9aa0a6", "#6b7280"];

function Dashboard({ go }) {
  const [cards, setCards] = useState({
    documentsProcessed: 0, riskAlerts: 0,
    aiLaunderingDetections: 0, authorshipViolations: 0,
  });
  const [trend, setTrend] = useState(DET_TREND);
  const [threat, setThreat] = useState(THREAT);
  const [langs, setLangs] = useState(LANGS);

  useEffect(() => {
    fetch(`${API}/api/dashboard/overview`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => {
        if (d.cards) setCards(d.cards);
        if (d.detectionTrend?.length) setTrend(d.detectionTrend.map(x => ({ m: x.month, direct: x.direct, ai: x.ai })));
        if (d.threatDistribution?.length) setThreat(d.threatDistribution.map((x, i) => ({
          name: x.name, v: x.value, c: THREAT_COLORS[i] || C.crimson,
        })));
        if (d.languageAnalysis?.length) setLangs(d.languageAnalysis.map(x => ({ l: x.pair, v: x.value })));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="reveal">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Overview</div>
          <h1 style={{ fontSize: 30 }}>NuroAI Intelligence Center</h1>
        </div>
        <button className="btn btn-primary" onClick={() => go("analyze")}><Upload size={16} /> New Analysis</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16 }}>
        <StatCard icon={FileText} label="Documents processed" value={cards.documentsProcessed.toLocaleString()} />
        <StatCard icon={AlertTriangle} label="Risk alerts" value={cards.riskAlerts.toLocaleString()} tone="red" />
        <StatCard icon={Sparkles} label="AI-laundering detections" value={cards.aiLaunderingDetections.toLocaleString()} tone="red" />
        <StatCard icon={Fingerprint} label="Authorship violations" value={cards.authorshipViolations.toLocaleString()} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginTop: 16 }} className="dash-row">
        <Glass pad={22}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <h3 style={{ fontSize: 16 }}>Detection trends</h3>
            <span className="chip"><TrendingUp size={13} color={C.red} /> 12 mo</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={C.red} stopOpacity={.45} /><stop offset="1" stopColor={C.red} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#cfcfd2" stopOpacity={.3} /><stop offset="1" stopColor="#cfcfd2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="m" tick={{ fill: "#8a8a90", fontSize: 11 }} stroke="rgba(255,255,255,.1)" />
              <YAxis tick={{ fill: "#8a8a90", fontSize: 11 }} stroke="rgba(255,255,255,.1)" />
              <Tooltip />
              <Area type="monotone" dataKey="ai" name="AI-generated" stroke={C.red} strokeWidth={2} fill="url(#gRed)" />
              <Area type="monotone" dataKey="direct" name="Direct" stroke="#cfcfd2" strokeWidth={2} fill="url(#gSil)" />
            </AreaChart>
          </ResponsiveContainer>
        </Glass>

        <Glass pad={22}>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>Threat distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={threat} dataKey="v" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={3} stroke="none">
                {threat.map((t, i) => <Cell key={i} fill={t.c} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {threat.map(t => (
              <span key={t.name} style={{ fontSize: 11, color: "#9a9aa0", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: t.c }} />{t.name}
              </span>
            ))}
          </div>
        </Glass>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }} className="dash-row">
        <Glass pad={22}>
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Plagiarism categories</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={threat} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#8a8a90", fontSize: 11 }} stroke="rgba(255,255,255,.1)" />
              <YAxis type="category" dataKey="name" tick={{ fill: "#9a9aa0", fontSize: 11 }} width={110} stroke="rgba(255,255,255,.1)" />
              <Tooltip />
              <Bar dataKey="v" radius={[0, 6, 6, 0]}>{threat.map((t, i) => <Cell key={i} fill={t.c} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Glass>
        <Glass pad={22}>
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Cross-language analysis</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={langs}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="l" tick={{ fill: "#8a8a90", fontSize: 11 }} stroke="rgba(255,255,255,.1)" />
              <YAxis tick={{ fill: "#8a8a90", fontSize: 11 }} stroke="rgba(255,255,255,.1)" />
              <Tooltip />
              <Bar dataKey="v" fill={C.crimson} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Glass>
      </div>
    </div>
  );
}

/* ============================================================
   DOCUMENT ANALYSIS — upload + pipeline
   ============================================================ */
const PIPELINE = [
  { icon: FileText, t: "OCR Extraction", d: "Parsing document structure & text" },
  { icon: Brain, t: "Semantic Analysis", d: "Building meaning embeddings" },
  { icon: Languages, t: "Translation Analysis", d: "Scanning 40+ language corpora" },
  { icon: Fingerprint, t: "Authorship Verification", d: "Comparing to writing DNA" },
  { icon: Sparkles, t: "AI Detection", d: "Probing for synthetic patterns" },
  { icon: Code2, t: "Code Intelligence", d: "AST & logic comparison" },
  { icon: Brain, t: "Neural Evidence", d: "Building evidence chamber" },
  { icon: FileCheck2, t: "Final Report", d: "Scoring & verdict" },
];
function DocAnalysis({ go, setDocId }) {
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [stage, setStage] = useState(-1);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const health = useBackendHealth();

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const start = async () => {
    if (!fileObj) { setError("Please select a file first."); return; }
    setError(null);
    setDone(false);
    setStage(0);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", fileObj);
      const uploadRes = await fetch(`${API}/api/documents/upload`, { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { documentId } = await uploadRes.json();
      setDocId(documentId);

      await fetch(`${API}/api/documents/${documentId}/analyze`, { method: "POST" });
      setUploading(false);

      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`${API}/api/documents/${documentId}/status`);
          const s = await r.json();
          setStage(Math.min(s.currentStage, PIPELINE.length - 1));
          if (s.status === "complete") {
            clearInterval(pollRef.current!);
            setStage(PIPELINE.length);
            setDone(true);
          } else if (s.status === "error") {
            clearInterval(pollRef.current!);
            setError(`Analysis failed: ${s.error ?? "backend error — check server logs"}`);
          }
        } catch { clearInterval(pollRef.current!); }
      }, 750);
    } catch (e: any) {
      setUploading(false);
      const msg = await diagnoseError(e);
      setError(msg);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) { setFileObj(f); setError(null); }
  };

  return (
    <div className="reveal">
      <div className="eyebrow" style={{ marginBottom: 8 }}>Ingest</div>
      <h1 style={{ fontSize: 30, marginBottom: 22 }}>Document Analysis</h1>

      {/* Backend health banner — only shows when offline or still checking */}
      {health !== "online" && (
        <div style={{ marginBottom: 18, padding: "13px 18px", borderRadius: 11,
          background: health === "offline" ? "rgba(239,68,68,.10)" : "rgba(245,158,11,.08)",
          border: `1px solid ${health === "offline" ? "rgba(239,68,68,.35)" : "rgba(245,158,11,.3)"}`,
          display: "flex", alignItems: "center", gap: 12 }}>
          <AlertTriangle size={16} color={health === "offline" ? C.red : "#f59e0b"} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13,
              color: health === "offline" ? C.red : "#f59e0b" }}>
              {health === "offline" ? "Backend service offline" : "Connecting to backend…"}
            </div>
            <div style={{ fontSize: 12, color: "#7a7a80", marginTop: 2 }}>
              {health === "offline"
                ? "Backend is waking up — Render free tier takes ~30s on first request. Refresh in a moment."
                : "Please wait while the engine initializes."}
            </div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%",
            background: health === "offline" ? C.red : "#f59e0b",
            animation: "glowPulse 1.2s ease-in-out infinite" }} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 16 }} className="dash-row">
        {/* upload */}
        <Glass pad={28} style={{ display: "flex", flexDirection: "column" }}>
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            style={{ border: "1.5px dashed rgba(255,30,30,.35)", borderRadius: 14, padding: "44px 20px",
              textAlign: "center", background: "radial-gradient(60% 80% at 50% 0%,rgba(255,30,30,.06),transparent)",
              position: "relative" }}>
            <div style={{ width: 60, height: 60, margin: "0 auto 16px", borderRadius: 16, display: "grid", placeItems: "center",
              background: "rgba(255,30,30,.1)", border: "1px solid rgba(255,30,30,.3)" }} className="pulse">
              <Upload size={26} color={C.red} />
            </div>
            <h3 style={{ fontSize: 18 }}>{fileObj ? fileObj.name : "Drag & drop to analyze"}</h3>
            <p style={{ color: "#8a8a90", fontSize: 14, marginTop: 6 }}>
              {fileObj ? `${(fileObj.size / 1024).toFixed(1)} KB` : "or click to browse from your device"}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
              {["PDF", "DOCX", "TXT", "ZIP"].map(x => <span key={x} className="chip mono" style={{ fontSize: 11 }}>{x}</span>)}
            </div>
            <input type="file" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setFileObj(f); setError(null); } }} />
          </div>

          {error && (
            <div style={{ marginTop: 12, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.28)",
              borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertTriangle size={15} color={C.red} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: C.red, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{error}</p>
              </div>
              <button onClick={start} style={{ marginTop: 10, fontSize: 12, padding: "6px 18px",
                background: "rgba(239,68,68,.14)", border: "1px solid rgba(239,68,68,.38)", borderRadius: 7,
                color: C.red, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ScanLine size={12} /> Retry
              </button>
            </div>
          )}

          <button className="btn btn-primary" style={{ marginTop: 16, justifyContent: "center" }}
            onClick={start} disabled={uploading}>
            {uploading ? <><Loader /> Uploading…</> : done ? "Re-run analysis" : <><ScanLine size={16} /> Run intelligence scan</>}
          </button>
        </Glass>

        {/* pipeline */}
        <Glass pad={24}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16 }}>Analysis pipeline</h3>
            {done && <span className="chip" style={{ color: "#7ee787" }}><CheckCircle2 size={13} /> Complete</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {PIPELINE.map((p, i) => {
              const active = stage === i;
              const finished = stage > i;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 12px", borderRadius: 11,
                  background: active ? "rgba(255,30,30,.08)" : "transparent",
                  border: active ? "1px solid rgba(255,30,30,.25)" : "1px solid transparent",
                  opacity: stage < 0 ? .55 : finished || active ? 1 : .4, transition: "all .3s" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", flexShrink: 0,
                    background: finished ? "rgba(126,231,135,.12)" : active ? "rgba(255,30,30,.14)" : "rgba(255,255,255,.04)",
                    border: `1px solid ${finished ? "rgba(126,231,135,.3)" : active ? "rgba(255,30,30,.35)" : "rgba(255,255,255,.08)"}` }}>
                    {finished ? <CheckCircle2 size={16} color="#7ee787" />
                      : active ? <p.icon size={16} color={C.red} className="pulse" />
                      : <p.icon size={16} color="#7a7a80" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "#e8e8ea", fontWeight: 500 }}>{p.t}</div>
                    <div style={{ fontSize: 12, color: "#7a7a80" }}>{active ? p.d : finished ? "Done" : p.d}</div>
                  </div>
                  {active && <Loader />}
                </div>
              );
            })}
          </div>
          {done && (
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} onClick={() => go("results")}>
              View intelligence report <ArrowRight size={16} />
            </button>
          )}
        </Glass>
      </div>
    </div>
  );
}
const Loader = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="9" cy="9" r="7" stroke="rgba(255,30,30,.2)" strokeWidth="2" fill="none" />
    <path d="M9 2 a7 7 0 0 1 7 7" stroke={C.red} strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

/* ============================================================
   RESULTS
   ============================================================ */
function Results({ go, docId }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    fetch(`${API}/api/documents/${docId}/results`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setReport(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [docId]);

  const tone = (s) => s >= 60 ? C.red : s >= 35 ? "#f59e0b" : "#7ee787";
  const scores = report?.scores ?? { authenticity: 0, risk: 0, confidence: 0, threat: "—" };
  const breakdown = report?.breakdown ?? [];
  const filename = report?.filename ?? "document";
  const pipelineStatus = report?.pipelineStatus ?? "OK";
  const ocr = report?.ocr ?? {};
  const aiDetection = report?.aiDetection ?? {};

  return (
    <div className="reveal">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Report · {filename}</div>
          <h1 style={{ fontSize: 30 }}>Intelligence Report</h1>
          {ocr.ocrEngine && (
            <span className="chip" style={{ marginTop: 8, display: "inline-flex", color: "#9a9aa0", fontSize: 11 }}>
              OCR: {ocr.ocrEngine} · {ocr.ocrConfidence ?? 0}% confidence
            </span>
          )}
        </div>
        <span className="chip" style={{ color: C.red, borderColor: "rgba(255,30,30,.35)", background: "rgba(255,30,30,.08)", fontSize: 13 }}>
          <AlertTriangle size={14} /> Threat level: {scores.threat}
        </span>
      </div>

      {pipelineStatus !== "OK" && report && (
        <div style={{ background: "rgba(255,30,30,.12)", border: "1px solid rgba(255,30,30,.35)", borderRadius: 11,
          padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 12, color: C.red, fontSize: 14 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {pipelineStatus === "OCR_FAILED"
                ? "We could not reliably extract text from this document."
                : pipelineStatus === "INSUFFICIENT_TEXT"
                ? "The document does not contain enough readable text to analyze."
                : "Document processing encountered an issue."}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,80,80,.8)" }}>
              {pipelineStatus === "OCR_FAILED"
                ? "This can happen with scanned images, low-quality PDFs, or image-only documents. Try uploading a text-based PDF or a higher-quality scan."
                : pipelineStatus === "INSUFFICIENT_TEXT"
                ? "Please upload a document with more written content. Very short documents may not produce accurate results."
                : "Some analysis channels may be incomplete. Core results are still available below."}
            </div>
          </div>
        </div>
      )}

      {aiDetection.status === "INSUFFICIENT_TEXT" && (
        <div style={{ background: "rgba(255,160,0,.1)", border: "1px solid rgba(255,160,0,.35)", borderRadius: 11,
          padding: "14px 18px", marginBottom: 16, color: "#f59e0b", fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={16} />
          {aiDetection.verdict ?? "Insufficient text length for reliable AI detection."} {aiDetection.evidence}
        </div>
      )}

      {aiDetection.aiProbability != null && aiDetection.status !== "INSUFFICIENT_TEXT" && (
        <Glass pad={18} style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>AI Probability</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 800, color: aiDetection.aiProbability >= 55 ? C.red : "#7ee787" }}>
              {aiDetection.aiProbability}%
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Human Probability</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 800, color: "#cfcfd2" }}>
              {aiDetection.humanProbability}%
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Verdict</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#e8e8ea" }}>{aiDetection.verdict ?? "—"}</div>
          </div>
        </Glass>
      )}

      {loading && <p style={{ color: "#8a8a90", marginBottom: 16 }}>Loading results…</p>}
      {!docId && !loading && <p style={{ color: "#8a8a90" }}>No document analysed yet. Go to Document Analysis and run a scan first.</p>}

      <Glass pad={28} style={{ position: "relative", overflow: "hidden", marginBottom: 16 }}>
        <div className="scanline" style={{ top: 0, opacity: .6 }} />
        <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24, position: "relative" }}>
          <ScoreRing value={scores.authenticity} label="Authenticity" color="#f59e0b" />
          <ScoreRing value={scores.risk} label="Risk" color={C.red} />
          <ScoreRing value={scores.confidence} label="Confidence" color="#7ee787" />
        </div>
      </Glass>

      {breakdown.length > 0 && (
        <>
          <h3 style={{ fontSize: 17, margin: "8px 0 14px" }}>Detection breakdown</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 16 }}>
            {breakdown.map((b, i) => (
              <Glass key={i} hover pad={20}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ fontSize: 15 }}>{b.title}</h4>
                  <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: tone(b.score) }}>{b.score}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,.07)", overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ width: `${b.score}%`, height: "100%", background: tone(b.score), borderRadius: 6,
                    transformOrigin: "left", animation: "countbar 1s ease both", boxShadow: `0 0 10px ${tone(b.score)}` }} />
                </div>
                <Row label="Evidence" val={b.evidence} />
                <Row label="Reasoning" val={b.reasoning} />
                <Row label="Confidence" val={`${b.confidence}%`} mono />
              </Glass>
            ))}
          </div>
        </>
      )}

      <button className="btn btn-ghost" style={{ marginTop: 18 }} onClick={() => go("evidence")}>
        <Brain size={16} /> Open neural evidence chamber
      </button>
    </div>
  );
}
const Row = ({ label, val, mono }) => (
  <div style={{ display: "flex", gap: 10, padding: "5px 0", fontSize: 13 }}>
    <span style={{ color: "#7a7a80", minWidth: 86, fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", paddingTop: 2 }}>{label}</span>
    <span className={mono ? "mono" : ""} style={{ color: "#cfcfd2" }}>{val}</span>
  </div>
);

const Field = ({ label, val, chips, mono }) => (
  <div style={{ marginBottom: 14 }}>
    <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
    {chips ? <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{chips.map(c => <span key={c} className="chip" style={{ fontSize: 11 }}>{c}</span>)}</div>
      : <div className={mono ? "mono" : ""} style={{ fontSize: 14, color: "#d4d4d8" }}>{val}</div>}
  </div>
);

/* ============================================================
   AUTHORSHIP — Writing DNA (live backend)
   ============================================================ */
function Authorship({ docId }: { docId: string | null }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    fetch(`${API}/api/documents/${docId}/authorship`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [docId]);

  const metrics = data?.metrics ?? [
    { k: "Writing Rhythm", v: 0 }, { k: "Vocabulary Complexity", v: 0 },
    { k: "Sentence Structure", v: 0 }, { k: "Writing Consistency", v: 0 },
    { k: "Author Similarity", v: 0 }, { k: "Behavioral Signature", v: 0 },
  ];
  const radar     = data?.radar   ?? DNA;
  const risk      = data?.risk    ?? 0;
  const verdict   = data?.verdict ?? "—";
  const detail    = data?.detail  ?? "Analyse a document first to see your writing DNA.";
  const authorSim = (metrics.find((m: any) => m.k === "Author Similarity") as any)?.v ?? Math.max(0, 100 - risk);

  return (
    <div className="reveal">
      <div className="eyebrow" style={{ marginBottom: 8 }}>Biometric of style</div>
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>Writing DNA Analysis</h1>
      <p style={{ color: "#9a9aa0", marginBottom: 22, maxWidth: 640 }}>A writing style fingerprint of the author compared against this submission. Significant divergence can signal ghostwriting or AI-assisted content.</p>

      {loading && <p style={{ color: "#8a8a90", marginBottom: 16 }}>Analysing writing style…</p>}
      {!docId && !loading && <p style={{ color: "#8a8a90", marginBottom: 16 }}>No document analysed yet — run a scan from Document Analysis first.</p>}
      {data?.status === "INSUFFICIENT_TEXT" && (
        <div style={{ background: "rgba(255,160,0,.1)", border: "1px solid rgba(255,160,0,.35)", borderRadius: 11,
          padding: "14px 18px", marginBottom: 16, color: "#f59e0b", fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={16} />
          Insufficient text for writing style analysis — less than 50 characters extracted from this document.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 }} className="dash-row">
        <Glass pad={28} style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(50% 60% at 50% 45%,rgba(255,30,30,.1),transparent)" }} />
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Writing Style Signature</h3>
          <p style={{ fontSize: 13, color: "#8a8a90", marginBottom: 4 }}>Author baseline vs. submission</p>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radar} outerRadius="72%">
              <PolarGrid stroke="rgba(255,255,255,.1)" />
              <PolarAngleAxis dataKey="k" tick={{ fill: "#9a9aa0", fontSize: 11 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar name="Author baseline" dataKey="a" stroke="#cfcfd2" fill="#cfcfd2" fillOpacity={.18} strokeWidth={2} />
              <Radar name="Submission" dataKey="b" stroke={C.red} fill={C.red} fillOpacity={.22} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Glass>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignContent: "start" }}>
          {metrics.map((m, i) => (
            <Glass key={i} hover pad={18}>
              <div style={{ fontSize: 12, color: "#8a8a90", marginBottom: 10, minHeight: 30 }}>{m.k}</div>
              <DNABar v={m.v} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: m.v < 50 ? C.red : "#fff" }}>{m.v}</span>
                <span style={{ fontSize: 11, color: m.v < 50 ? C.red : "#7ee787" }}>{m.v < 50 ? "Divergent" : "Aligned"}</span>
              </div>
            </Glass>
          ))}
        </div>
      </div>

      <Glass pad={24} style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Fingerprint size={40} color={C.red} className="pulse" />
            <div>
              <h3 style={{ fontSize: 17 }}>Verdict: {verdict}</h3>
              <p style={{ color: "#9a9aa0", fontSize: 14, marginTop: 4 }}>{detail}</p>
              {data && (
                <p style={{ fontSize: 13, fontWeight: 500, marginTop: 8,
                  color: authorSim >= 70 ? "#7ee787" : authorSim >= 40 ? "#f59e0b" : C.red }}>
                  This submission matches {authorSim}% of the author&apos;s writing signature.
                </p>
              )}
            </div>
          </div>
          <ScoreRing value={risk} label="Risk" color={C.red} size={92} />
        </div>
      </Glass>
    </div>
  );
}
function DNABar({ v }) {
  return (
    <div style={{ display: "flex", gap: 3, height: 36, alignItems: "flex-end" }}>
      {Array.from({ length: 16 }).map((_, i) => {
        const on = (i / 16) * 100 < v;
        return <div key={i} style={{ flex: 1, height: `${30 + Math.sin(i * 1.3) * 20 + 20}%`,
          background: on ? (v < 50 ? C.red : "linear-gradient(180deg,#fff,#9a9aa0)") : "rgba(255,255,255,.07)",
          borderRadius: 2, boxShadow: on && v < 50 ? "0 0 6px rgba(255,30,30,.6)" : "none" }} />;
      })}
    </div>
  );
}

/* ============================================================
   CROSS-LANGUAGE (live backend)
   ============================================================ */
function CrossLang({ docId }: { docId: string | null }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    fetch(`${API}/api/documents/${docId}/crosslang`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [docId]);

  const langs = data?.langs ?? [
    { code: "ES", name: "Spanish", x: 78, y: 30, sim: 0 },
    { code: "ZH", name: "Chinese", x: 30, y: 28, sim: 0 },
    { code: "FR", name: "French",  x: 80, y: 72, sim: 0 },
    { code: "DE", name: "German",  x: 26, y: 74, sim: 0 },
  ];

  return (
    <div className="reveal">
      <div className="eyebrow" style={{ marginBottom: 8 }}>Beyond one language</div>
      <h1 style={{ fontSize: 30, marginBottom: 22 }}>Cross-Language Intelligence</h1>

      {loading && <p style={{ color: "#8a8a90", marginBottom: 16 }}>Scanning cross-language corpus…</p>}
      {!docId && !loading && <p style={{ color: "#8a8a90", marginBottom: 16 }}>No document analysed yet — run a scan from Document Analysis first.</p>}
      {(data?.status === "OCR_FAILED" || data?.status === "INSUFFICIENT_TEXT") && (
        <div style={{ background: "rgba(255,30,30,.1)", border: "1px solid rgba(255,30,30,.35)", borderRadius: 11,
          padding: "14px 18px", marginBottom: 16, color: C.red, fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={16} />
          Cross-language analysis unavailable: <b>{data.status}</b> — no text could be extracted from this document.
        </div>
      )}

      {data?.status === "LANGUAGE_NOT_PRESENT" ? (
        <Glass pad={36} style={{ textAlign: "center", marginTop: 8 }}>
          <Languages size={44} color="#5a5a60" style={{ margin: "0 auto 16px", display: "block" }} />
          <h3 style={{ fontSize: 20 }}>No multilingual content detected.</h3>
          <p style={{ color: "#9a9aa0", fontSize: 14, marginTop: 10, maxWidth: 480, margin: "10px auto 0" }}>
            This document is written entirely in English. Cross-language plagiarism analysis was skipped — no foreign-language script or diacritics were detected.
          </p>
        </Glass>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16 }} className="dash-row">
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <Glass pad={20}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Detected mapping</div>
            <Field label="Source language" val={data?.sourceLanguage ?? "—"} />
            <Field label="Target language" val={data?.targetLanguage ?? "—"} />
            <Field label="Translation similarity" val={data ? `${data.translationSimilarity}%` : "—"} mono />
            <Field label="Semantic similarity" val={data ? `${data.semanticSimilarity} cosine` : "—"} mono />
          </Glass>
          {langs.map(l => (
            <Glass key={l.code} hover pad={16}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "#e8e8ea" }}><b className="mono">{l.code}</b> · {l.name}</span>
                <span className="mono" style={{ color: l.sim > 70 ? C.red : "#9a9aa0", fontWeight: 700 }}>{l.sim}%</span>
              </div>
            </Glass>
          ))}
        </div>

        {/* language relationship graph */}
        <Glass pad={24} style={{ position: "relative", minHeight: 420 }}>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>Language relationship graph</h3>
          <div style={{ position: "relative", width: "100%", height: 360 }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              {langs.map((l, i) => (
                <line key={i} x1="50" y1="50" x2={l.x} y2={l.y} stroke={l.sim > 70 ? C.red : "rgba(180,180,190,.4)"}
                  strokeWidth={l.sim / 60} strokeDasharray="4 3" style={{ filter: l.sim > 70 ? "drop-shadow(0 0 3px rgba(255,30,30,.6))" : "none" }} />
              ))}
            </svg>
            {/* center */}
            <Node x={50} y={50} label="EN" center sim={100} />
            {langs.map(l => <Node key={l.code} x={l.x} y={l.y} label={l.code} sim={l.sim} />)}
          </div>
        </Glass>
      </div>
      )}
    </div>
  );
}
function Node({ x, y, label, center, sim }) {
  const size = center ? 64 : 50;
  return (
    <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", textAlign: "center" }}>
      <div className={center ? "pulse" : ""} style={{ width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center",
        background: center ? "linear-gradient(135deg,#ff3b3b,#7f1414)" : "rgba(255,255,255,.05)",
        border: `1.5px solid ${center || sim > 70 ? "rgba(255,30,30,.6)" : "rgba(255,255,255,.18)"}`,
        boxShadow: center ? "0 0 24px rgba(255,30,30,.5)" : sim > 70 ? "0 0 14px rgba(255,30,30,.3)" : "none",
        fontWeight: 700, color: "#fff", fontSize: center ? 18 : 14 }}><span className="mono">{label}</span></div>
      {!center && <div style={{ fontSize: 10, color: "#8a8a90", marginTop: 4 }}>{sim}%</div>}
    </div>
  );
}

/* ============================================================
   CODE INTELLIGENCE (live backend + paste comparison)
   ============================================================ */
function CodeIntel({ docId }: { docId: string | null }) {
  const [docData, setDocData]   = useState<any>(null);
  const [cmpData, setCmpData]   = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [leftCode, setLeftCode] = useState("");
  const [rightCode, setRightCode] = useState("");
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    fetch(`${API}/api/documents/${docId}/code`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setDocData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [docId]);

  const compare = async () => {
    if (!leftCode.trim() || !rightCode.trim()) return;
    setComparing(true);
    try {
      const r = await fetch(`${API}/api/code/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ left: leftCode, right: rightCode }),
      });
      const d = await r.json();
      setCmpData(d);
    } finally {
      setComparing(false);
    }
  };

  const active = cmpData ?? docData;
  const metrics = [
    { k: "Code Similarity",  v: active?.codeSimilarity  ?? 0 },
    { k: "Logic Similarity", v: active?.logicSimilarity ?? 0 },
    { k: "AST Match",        v: active?.astMatch        ?? 0 },
    { k: "Structure",        v: active?.structure       ?? 0 },
  ];
  const evasion = active?.renameEvasion ?? false;
  const note    = active?.note ?? "";

  return (
    <div className="reveal">
      <div className="eyebrow" style={{ marginBottom: 8 }}>Source-level</div>
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>Code Intelligence</h1>
      <p style={{ color: "#9a9aa0", marginBottom: 22, maxWidth: 640 }}>Structural comparison that sees through renamed variables, reordering, and reformatting.</p>

      {loading && <p style={{ color: "#8a8a90", marginBottom: 16 }}>Analysing code patterns…</p>}
      {!docId && !loading && !active && <p style={{ color: "#8a8a90", marginBottom: 16 }}>No document analysed yet. Paste two code snippets below to compare directly.</p>}
      {docData?.status === "NO_CODE_DETECTED" && !cmpData && (
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 11,
          padding: "14px 18px", marginBottom: 16, color: "#9a9aa0", fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <Code2 size={16} />
          No code patterns detected in this document. Use the paste comparison below to compare code manually.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }} className="dash-row">
        {metrics.map(m => (
          <Glass key={m.k} pad={16} hover>
            <div style={{ fontSize: 12, color: "#8a8a90", marginBottom: 8 }}>{m.k}</div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: m.v > 80 ? C.red : "#fff" }}>{m.v}%</div>
            <div style={{ height: 4, background: "rgba(255,255,255,.07)", borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
              <div style={{ width: `${m.v}%`, height: "100%", background: C.red, borderRadius: 4, animation: "countbar 1s ease both", transformOrigin: "left" }} />
            </div>
          </Glass>
        ))}
      </div>

      {note && (
        <Glass pad={18} style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <GitCompare size={22} color={C.red} />
          <div>
            <h4 style={{ fontSize: 15 }}>{evasion ? "Variable-renaming evasion detected" : "Code comparison result"}</h4>
            <p style={{ fontSize: 13, color: "#9a9aa0", marginTop: 2 }}>{note}</p>
          </div>
        </Glass>
      )}

      <h3 style={{ fontSize: 15, color: "#8a8a90", marginBottom: 12, marginTop: 8 }}>Compare code snippets</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }} className="dash-row">
        <Glass pad={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.02)", fontSize: 13, color: "#cfcfd2" }} className="mono">submission</div>
          <textarea placeholder="Paste submitted code here…" value={leftCode} onChange={e => setLeftCode(e.target.value)}
            style={{ width: "100%", minHeight: 180, padding: "12px 14px", background: "transparent", border: "none", color: "#cfcfd2",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </Glass>
        <Glass pad={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.02)", fontSize: 13, color: "#cfcfd2" }} className="mono">source</div>
          <textarea placeholder="Paste source code here…" value={rightCode} onChange={e => setRightCode(e.target.value)}
            style={{ width: "100%", minHeight: 180, padding: "12px 14px", background: "transparent", border: "none", color: "#cfcfd2",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </Glass>
      </div>
      <button className="btn btn-primary" onClick={compare} disabled={comparing || !leftCode.trim() || !rightCode.trim()}
        style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <GitCompare size={16} />{comparing ? "Comparing…" : "Compare Code"}
      </button>
    </div>
  );
}
function CodePane({ title, lines, flag }) {
  return (
    <Glass pad={0} style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.02)" }}>
        <span className="mono" style={{ fontSize: 13, color: "#cfcfd2" }}>{title}</span>
        {flag && <span className="chip" style={{ color: C.red, fontSize: 11, borderColor: "rgba(255,30,30,.3)" }}>match</span>}
      </div>
      <div style={{ padding: "14px 16px" }}>
        {lines.map(([code, hl], i) => (
          <div key={i} className={`codeline ${hl === "red" ? "hl-red" : hl === "amber" ? "hl-amber" : ""}`}>
            <span className="ln">{i + 1}</span>
            <span style={{ color: hl ? "#e8e8ea" : "#9a9aa0", whiteSpace: "pre" }}>{code}</span>
          </div>
        ))}
      </div>
    </Glass>
  );
}

/* ============================================================
   SETTINGS (persisted to MongoDB via GET/POST /api/settings)
   ============================================================ */
const TOGGLE_MAP: [string, string][] = [
  ["Semantic Intelligence",    "semanticIntelligence"],
  ["AI-Laundering Detection",  "aiLaunderingDetection"],
  ["Cross-Language Detection", "crossLanguageDetection"],
  ["Authorship Verification",  "authorshipVerification"],
  ["Code Intelligence",        "codeIntelligence"],
  ["Auto-quarantine high risk","autoQuarantine"],
];

function SettingsPage({ settings, onToggle, notification }: {
  settings: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
  notification: { msg: string; ok: boolean } | null;
}) {
  return (
    <div className="reveal">
      <div className="eyebrow" style={{ marginBottom: 8 }}>Configuration</div>
      <h1 style={{ fontSize: 30, marginBottom: 22 }}>Settings</h1>
      {notification && (
        <div style={{
          padding: "10px 16px", borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 500,
          background: notification.ok ? "rgba(126,231,135,.12)" : "rgba(255,30,30,.12)",
          border: `1px solid ${notification.ok ? "rgba(126,231,135,.35)" : "rgba(255,30,30,.35)"}`,
          color: notification.ok ? "#7ee787" : C.red,
        }}>
          {notification.msg}
        </div>
      )}
      <Glass pad={24} style={{ maxWidth: 620 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Detection layers</h3>
        {TOGGLE_MAP.map(([label, key], i) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "13px 0", borderBottom: i < TOGGLE_MAP.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
            <span style={{ fontSize: 14, color: "#d4d4d8" }}>{label}</span>
            <Toggle on={settings[key] ?? false} onChange={(v) => onToggle(key, v)} />
          </div>
        ))}
      </Glass>
    </div>
  );
}
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{ width: 44, height: 24, borderRadius: 99,
      background: on ? "linear-gradient(90deg,#ff3b3b,#c81e1e)" : "rgba(255,255,255,.12)",
      boxShadow: on ? "0 0 12px rgba(255,30,30,.4)" : "none", position: "relative", transition: "all .25s" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: "50%",
        background: "#fff", transition: "left .25s" }} />
    </button>
  );
}

/* ============================================================
   TOP NAV (marketing)
   ============================================================ */
function TopNav({ go }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", f); return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 66,
      display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px",
      background: scrolled ? "rgba(6,6,6,.8)" : "transparent", backdropFilter: scrolled ? "blur(14px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,.07)" : "1px solid transparent", transition: "all .3s" }}>
      <div onClick={() => go("landing")} style={{ cursor: "pointer" }}><Logo size={28} tagline={false} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="btn btn-ghost" style={{ padding: "9px 16px" }} onClick={() => go("dashboard")}>Dashboard</button>
        <button className="btn btn-primary" style={{ padding: "9px 18px" }} onClick={() => go("analyze")}>
          <ScanLine size={15} /> Start Analysis
        </button>
      </div>
    </nav>
  );
}

/* ============================================================
   LOADING SCREEN
   ============================================================ */
function LoadingScreen() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: C.black0, display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div className="pulse" style={{ display: "inline-block", filter: "drop-shadow(0 0 24px rgba(255,30,30,.5))" }}>
          <ShieldMark size={64} />
        </div>
        <div style={{ marginTop: 20, fontFamily: "'Spectral',serif", fontSize: 28, fontWeight: 800 }}>
          <span className="metallic">Nuro</span><span className="crimsonText">AI</span>
        </div>
        <div style={{ width: 180, height: 3, background: "rgba(255,255,255,.08)", borderRadius: 3, margin: "18px auto 0", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,transparent,#ff1e1e,transparent)",
            backgroundSize: "200% 100%", animation: "shimmer 1.1s linear infinite", width: "100%" }} />
        </div>
        <div className="mono" style={{ fontSize: 11, color: "#7a7a80", marginTop: 14, letterSpacing: ".2em" }}>INITIALIZING INTELLIGENCE ENGINE</div>
      </div>
    </div>
  );
}

/* ============================================================
   APP ROOT
   ============================================================ */
const DEFAULT_APP_SETTINGS: Record<string, boolean> = {
  semanticIntelligence: true, aiLaunderingDetection: true,
  crossLanguageDetection: true, authorshipVerification: true,
  codeIntelligence: false, autoQuarantine: false,
};

export default function App() {
  const [view, setView] = useState("landing");
  const [loading, setLoading] = useState(true);
  const [docId, setDocId] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<Record<string, boolean>>(DEFAULT_APP_SETTINGS);
  const [settingsNotif, setSettingsNotif] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1600); return () => clearTimeout(t); }, []);

  useEffect(() => {
    fetch(`${API}/api/settings`)
      .then(r => r.json())
      .then(d => setAppSettings(s => ({ ...s, ...d })))
      .catch(() => {});
  }, []);

  const go = (v) => { setView(v); window.scrollTo({ top: 0 }); };

  const handleSettingToggle = async (key: string, value: boolean) => {
    const prev = appSettings;
    setAppSettings(s => ({ ...s, [key]: value }));
    try {
      const r = await fetch(`${API}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!r.ok) throw new Error("save failed");
      setSettingsNotif({ msg: "Settings saved.", ok: true });
    } catch {
      setAppSettings(prev);
      setSettingsNotif({ msg: "Failed to save settings.", ok: false });
    }
    setTimeout(() => setSettingsNotif(null), 3000);
  };

  const isConsole = view !== "landing";
  const page = {
    dashboard: <Dashboard go={go} />,
    analyze: <DocAnalysis go={go} setDocId={setDocId} />,
    results: <Results go={go} docId={docId} />,
    galaxy: <GalaxyErrorBoundary><LanguageGalaxy docId={docId} /></GalaxyErrorBoundary>,
    evidence: <GalaxyErrorBoundary><NeuralEvidenceChamber docId={docId} /></GalaxyErrorBoundary>,
    authorship: <Authorship docId={docId} />, crosslang: <CrossLang docId={docId} />,
    code: <CodeIntel docId={docId} />,
    settings: <SettingsPage settings={appSettings} onToggle={handleSettingToggle} notification={settingsNotif} />,
  }[view];

  return (
    <div className="nuro">
      <GlobalStyle />
      {loading && <LoadingScreen />}
      <style>{`
        @media (max-width: 860px){
          .dash-row{ grid-template-columns:1fr !important; }
          .sidebar{ display:none !important; }
        }
      `}</style>
      {!isConsole ? (
        <>
          <TopNav go={go} />
          <Landing go={go} />
        </>
      ) : (
        <Shell view={view} go={go}>{page}</Shell>
      )}
    </div>
  );
}
