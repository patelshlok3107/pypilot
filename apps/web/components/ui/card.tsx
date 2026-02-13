import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-[0_10px_25px_rgba(2,6,23,0.35)]",
        className,
      )}
      {...props}
    />
  );
}

