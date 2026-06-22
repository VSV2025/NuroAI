import { motion } from "framer-motion";
import { ShieldMark, Wordmark } from "@/components/brand/Logo";
import { NeuralBackground } from "@/components/effects/NeuralBackground";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-ink-0">
      <NeuralBackground density={0.00007} className="opacity-50" />
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <ShieldMark className="h-20 animate-pulse-glow" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-5"
        >
          <Wordmark className="text-3xl" />
        </motion.div>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-ultra text-silver-dim">
          Protecting Authentic Learning
        </p>
        <div className="mt-7 h-[3px] w-44 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-crimson-sheen shadow-glow-sm"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-silver-dim/70">
          Initializing intelligence engine…
        </p>
      </div>
    </div>
  );
}
