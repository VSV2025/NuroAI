import { Link } from "react-router-dom";
import { LogoLockup } from "@/components/brand/Logo";
import { ShieldCheck } from "lucide-react";

const cols = [
  { title: "Platform", items: ["Document Analysis", "Authorship", "Cross-Language", "Code Intelligence", "Explainable AI"] },
  { title: "Company", items: ["About", "Careers", "Research", "Security", "Press"] },
  { title: "Resources", items: ["Documentation", "API Reference", "Status", "Changelog", "Trust Center"] },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-ink-1/60">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <LogoLockup />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-silver-dim">
              A multi-dimensional plagiarism intelligence platform. Detection across text,
              meaning, language, authorship and code — with evidence you can defend.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-crimson-bright" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-silver-dim">
                SOC 2 · ISO 27001
              </span>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="eyebrow mb-4">{c.title}</p>
              <ul className="space-y-2.5">
                {c.items.map((i) => (
                  <li key={i}>
                    <Link
                      to="/dashboard"
                      className="text-sm text-silver-dim transition-colors hover:text-silver-bright"
                    >
                      {i}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-silver-dim md:flex-row">
          <span>© {new Date().getFullYear()} NuroAI, Inc. Protecting Authentic Learning.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-silver-bright">Privacy</a>
            <a href="#" className="hover:text-silver-bright">Terms</a>
            <a href="#" className="hover:text-silver-bright">DPA</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
