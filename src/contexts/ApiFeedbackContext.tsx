import React, { createContext, useContext } from "react";
import type { OptionsObject } from "notistack";

export type ApiFeedbackEvent =
  | { type: "success"; message: string; options?: OptionsObject }
  | { type: "error"; message: string; options?: OptionsObject }
  | { type: "info"; message: string; options?: OptionsObject }
  | { type: "warning"; message: string; options?: OptionsObject };

type ApiFeedbackContextValue = {
  notify: (event: ApiFeedbackEvent) => void;
};

const ApiFeedbackContext = createContext<ApiFeedbackContextValue | null>(null);

export function ApiFeedbackProvider(props: { children: React.ReactNode; notify: ApiFeedbackContextValue["notify"] }) {
  return <ApiFeedbackContext.Provider value={{ notify: props.notify }}>{props.children}</ApiFeedbackContext.Provider>;
}

export function useApiFeedback() {
  const ctx = useContext(ApiFeedbackContext);
  if (!ctx) {
    throw new Error("useApiFeedback must be used within <ApiFeedbackProvider />");
  }
  return ctx;
}

