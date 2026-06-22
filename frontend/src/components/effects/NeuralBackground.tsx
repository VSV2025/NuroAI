import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number; hot: boolean };

/**
 * Animated neural network field — the platform's ambient signature.
 * Silver synapses with crimson "hot" nodes that pulse, plus rising
 * intelligence particles. Pauses for prefers-reduced-motion.
 */
export function NeuralBackground({
  density = 0.00009,
  className = "",
}: {
  density?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let nodes: Node[] = [];
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const build = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      w = rect?.width ?? window.innerWidth;
      h = rect?.height ?? window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(28, Math.min(120, Math.floor(w * h * density)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
        hot: Math.random() < 0.16,
      }));
    };

    let t = 0;
    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, w, h);

      // links
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            const o = (1 - dist / 130) * 0.5;
            const hot = a.hot || b.hot;
            ctx.strokeStyle = hot
              ? `rgba(255,30,30,${o * 0.7})`
              : `rgba(217,217,217,${o * 0.28})`;
            ctx.lineWidth = hot ? 0.7 : 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
        const pulse = n.hot ? 0.6 + 0.4 * Math.sin(t * 2 + n.x) : 1;
        if (n.hot) {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 14);
          g.addColorStop(0, `rgba(255,30,30,${0.5 * pulse})`);
          g.addColorStop(1, "rgba(255,30,30,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = n.hot ? `rgba(255,90,90,${pulse})` : "rgba(230,230,230,0.7)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    build();
    draw();
    const onResize = () => build();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
