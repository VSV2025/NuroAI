import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  FileSearch,
  Fingerprint,
  Languages,
  Code2,
  FileBarChart,
  Settings,
  Sparkles,
  Search,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { ShieldMark, Wordmark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/analyze", label: "Document Analysis", icon: FileSearch },
  { to: "/dashboard/results", label: "Results", icon: FileBarChart },
  { to: "/dashboard/explainable", label: "Explainable AI", icon: Sparkles },
  { to: "/dashboard/authorship", label: "Authorship Verification", icon: Fingerprint },
  { to: "/dashboard/cross-language", label: "Cross-Language", icon: Languages },
  { to: "/dashboard/code", label: "Code Intelligence", icon: Code2 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-0">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[260px] border-r border-white/[0.06] bg-ink-1/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-5">
          <ShieldMark className="h-7" />
          <Wordmark className="text-xl" />
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const active =
              item.to === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-crimson/10 text-silver-bright"
                    : "text-silver-dim hover:bg-white/[0.04] hover:text-silver-bright"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-crimson-sheen shadow-glow-sm"
                  />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active ? "text-crimson-bright" : "text-silver-dim group-hover:text-silver"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-4">
          <div className="glass metal-edge flex items-center gap-3 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-crimson-sheen font-mono text-sm font-bold text-white">
              AK
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-silver-bright">Dr. A. Khanna</p>
              <p className="truncate text-xs text-silver-dim">Integrity Office</p>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-ink-0/80 px-5 backdrop-blur-xl">
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-silver-dim lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="relative hidden flex-1 max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-dim" />
            <input
              placeholder="Search documents, authors, cases…"
              className="h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.02] pl-10 pr-4 text-sm text-silver-bright placeholder:text-silver-dim/70 focus:border-crimson/40 focus:outline-none focus:ring-1 focus:ring-crimson/40"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                Engine Live
              </span>
            </span>
            <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] text-silver-dim hover:text-silver-bright">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-crimson-bright shadow-glow-sm" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-7xl px-5 py-7"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Reusable page heading for dashboard pages */
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-metal">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-silver-dim">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
