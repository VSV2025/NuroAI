import { useState } from "react";
import { PageHeading } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const layers = [
  "Direct plagiarism",
  "AI paraphrasing",
  "Cross-language",
  "Idea plagiarism",
  "Authorship verification",
  "Code intelligence",
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        on ? "bg-crimson-sheen shadow-glow-sm" : "bg-white/10"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export default function Settings() {
  const [enabled, setEnabled] = useState(() => layers.map(() => true));
  const [threshold, setThreshold] = useState(45);

  return (
    <div>
      <PageHeading
        eyebrow="Configuration"
        title="Settings"
        description="Tune detection layers and sensitivity for your institution."
        action={<Button>Save Changes</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <p className="eyebrow mb-4">Detection layers</p>
          <div className="space-y-1">
            {layers.map((l, i) => (
              <div key={l} className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-white/[0.02]">
                <span className="text-sm text-silver">{l}</span>
                <Toggle
                  on={enabled[i]}
                  onClick={() => setEnabled((e) => e.map((v, idx) => (idx === i ? !v : v)))}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="eyebrow mb-4">Risk threshold</p>
          <p className="font-display text-5xl font-extrabold text-crimson-metal">{threshold}</p>
          <p className="mb-5 mt-1 text-sm text-silver-dim">
            Documents scoring above this trigger a review alert.
          </p>
          <input
            type="range"
            min={0}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-[#FF1E1E]"
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-silver-dim">
            <span>Lenient</span>
            <span>Strict</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
