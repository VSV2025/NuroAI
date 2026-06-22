import { Link } from "react-router-dom";
import { ShieldMark, Wordmark } from "@/components/brand/Logo";
import { NeuralBackground } from "@/components/effects/NeuralBackground";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5 text-center">
      <NeuralBackground className="opacity-40" />
      <div className="relative">
        <ShieldMark className="mx-auto h-16 animate-pulse-glow" />
        <Wordmark className="mt-4 text-3xl" />
        <p className="mt-6 font-display text-6xl font-extrabold text-metal">404</p>
        <p className="mt-2 text-silver-dim">This page left no trace in the index.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Back to site</Button>
        </Link>
      </div>
    </div>
  );
}
