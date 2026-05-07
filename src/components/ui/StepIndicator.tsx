"use client";

import * as React from "react";
import { Check } from "lucide-react";

export type StepDefinition = {
  n: number;
  label: string;
};

export function StepIndicator({
  currentStep,
  steps,
  className,
}: {
  currentStep: number;
  steps: StepDefinition[];
  className?: string;
}) {
  return (
    <div className={["flex items-center", className].filter(Boolean).join(" ")}>
      {steps.map((s, i) => {
        const isActive = currentStep === s.n;
        const isDone = currentStep > s.n;
        return (
          <React.Fragment key={s.n}>
            <div className="flex items-center gap-2">
              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isDone
                    ? "bg-(--nebula-gold) text-white"
                    : isActive
                      ? "bg-primary text-white"
                      : "bg-white/10 text-(--nebula-muted)",
                ].join(" ")}
              >
                {isDone ? <Check className="h-4 w-4" /> : s.n}
              </div>
              <span
                className={[
                  "hidden text-xs font-medium sm:inline",
                  isActive
                    ? "text-white"
                    : isDone
                      ? "text-(--nebula-muted)"
                      : "text-(--nebula-muted)",
                ].join(" ")}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={[
                  "mx-3 h-0.5 flex-1 rounded-full transition-colors",
                  currentStep > s.n ? "bg-(--nebula-gold)" : "bg-white/20",
                ].join(" ")}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

