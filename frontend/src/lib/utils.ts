import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreColor(value: number): string {
  if (value >= 75) return "#FF1E1E";
  if (value >= 45) return "#f59e0b";
  return "#22c55e";
}
