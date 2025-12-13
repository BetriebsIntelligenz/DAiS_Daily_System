"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { ProgramDefinition } from "@/lib/types";

type CompletionHandler = (program: ProgramDefinition) => void | Promise<void>;

export interface ProgramCompletionOverrides {
  onProgramCompleted?: CompletionHandler;
  redirectTo?: string | null;
  autoSubmitEnabled?: boolean;
  registerAutoSubmit?: ((submitter: (() => Promise<void>) | null) => void) | null;
}

const ProgramCompletionContext = createContext<ProgramCompletionOverrides | null>(
  null
);

export function ProgramCompletionProvider({
  value,
  children
}: {
  value: ProgramCompletionOverrides;
  children: ReactNode;
}) {
  return (
    <ProgramCompletionContext.Provider value={value}>
      {children}
    </ProgramCompletionContext.Provider>
  );
}

export function useProgramCompletionContext() {
  return useContext(ProgramCompletionContext);
}
