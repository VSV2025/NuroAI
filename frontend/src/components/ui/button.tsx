import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-0 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-crimson-sheen text-white shadow-glow-sm hover:shadow-glow hover:brightness-110 active:scale-[0.98]",
        metal:
          "border border-white/10 bg-white/[0.04] text-silver-bright backdrop-blur hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98]",
        ghost:
          "text-silver-dim hover:text-silver-bright hover:bg-white/[0.04]",
        outline:
          "border border-crimson/40 text-crimson-bright hover:bg-crimson/10 hover:border-crimson",
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
