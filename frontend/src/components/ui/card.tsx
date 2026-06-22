import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { edge?: boolean }
>(({ className, edge = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("glass p-5", edge && "metal-edge", className)}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-3 flex items-start justify-between gap-3", className)} {...p} />
);

export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-sm font-semibold tracking-wide text-silver-bright", className)} {...p} />
);

export const CardDescription = ({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm leading-relaxed text-silver-dim", className)} {...p} />
);

export const CardContent = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("", className)} {...p} />
);
