import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
  {
    variants: {
      tone: {
        neutral: "border-white/10 bg-white/[0.03] text-silver-dim",
        red: "border-crimson/40 bg-crimson/10 text-crimson-bright",
        amber: "border-amber-500/40 bg-amber-500/10 text-amber-400",
        green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, tone, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ tone }), className)} {...props} />
);
