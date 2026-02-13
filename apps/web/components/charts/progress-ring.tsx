"use client";

import { useMemo } from "react";

type ProgressRingProps = {
  value: number;
  label: string;
};

export function ProgressRing({ value, label }: ProgressRingProps) {
  const normalized = Math.max(0, Math.min(100, value));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = useMemo(
    () => circumference - (normalized / 100) * circumference,
    [circumference, normalized],
  );

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} strokeWidth="7" className="fill-none stroke-white/10" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="7"
          strokeLinecap="round"
          className="fill-none stroke-brand-400 transition-all duration-700"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-xl font-semibold text-white">{Math.round(normalized)}%</p>
        <p className="text-[11px] uppercase tracking-wide text-slate-300">{label}</p>
      </div>
    </div>
  );
}
