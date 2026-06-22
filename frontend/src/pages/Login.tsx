import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { NeuralBackground } from "@/components/effects/NeuralBackground";
import { ShieldMark, Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export default function Login() {
  const nav = useNavigate();
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5">
      <NeuralBackground className="opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-crimson/15 blur-[130px]" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass metal-edge relative z-10 w-full max-w-md p-8"
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <ShieldMark className="h-14 animate-pulse-glow" />
          <Wordmark className="mt-4 text-3xl" />
          <p className="mt-2 font-mono text-[11px] uppercase tracking-ultra text-silver-dim">
            Intelligence Console
          </p>
        </div>

        <div className="space-y-4">
          <Field icon={<Mail className="h-4 w-4" />} label="Work email" placeholder="you@university.edu" />
          <Field icon={<Lock className="h-4 w-4" />} label="Password" type="password" placeholder="••••••••••" />
          <Button className="w-full" size="lg" onClick={() => nav("/dashboard")}>
            Enter Console <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-silver-dim">
          <ShieldCheck className="h-3.5 w-3.5 text-crimson-bright" />
          SSO · SAML · enterprise-grade encryption
        </div>
        <button
          onClick={() => nav("/")}
          className="mt-5 w-full text-center text-xs text-silver-dim hover:text-silver-bright"
        >
          ← Back to site
        </button>
      </motion.div>
    </div>
  );
}

function Field({
  icon,
  label,
  type = "text",
  placeholder,
}: {
  icon: ReactNode;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-silver-dim">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-silver-dim">
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.02] pl-10 pr-4 text-sm text-silver-bright placeholder:text-silver-dim/60 focus:border-crimson/40 focus:outline-none focus:ring-1 focus:ring-crimson/40"
        />
      </div>
    </label>
  );
}
