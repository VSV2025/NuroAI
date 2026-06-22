import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogoLockup } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "Platform", href: "#solution" },
  { label: "Why NuroAI", href: "#problem" },
  { label: "Impact", href: "#impact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-2.5" : "py-4"
      )}
    >
      <div className="mx-auto max-w-7xl px-5">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300",
            scrolled ? "glass metal-edge" : "border border-transparent"
          )}
        >
          <Link to="/" className="shrink-0">
            <LogoLockup />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-silver-dim transition-colors hover:text-silver-bright"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => nav("/login")}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => nav("/dashboard")}>
              Open Console
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
