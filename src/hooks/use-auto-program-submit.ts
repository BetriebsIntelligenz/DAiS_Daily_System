"use client";

import { useCallback, useEffect, useRef } from "react";

import { useProgramCompletionContext } from "@/contexts/program-completion-context";

type SubmitHandler = () => Promise<void>;

export function useAutoProgramSubmit(handler: SubmitHandler | null | undefined) {
  const overrides = useProgramCompletionContext();
  const enabled = Boolean(overrides?.autoSubmitEnabled);
  const handlerRef = useRef<SubmitHandler | null>(handler ?? null);
  const hasHandler = Boolean(handler);

  useEffect(() => {
    handlerRef.current = handler ?? null;
  }, [handler]);

  const stableInvoker = useCallback(async () => {
    const submit = handlerRef.current;
    if (submit) {
      await submit();
    }
  }, []);

  useEffect(() => {
    if (!enabled || !overrides?.registerAutoSubmit) {
      return;
    }
    if (!hasHandler) {
      overrides.registerAutoSubmit(null);
      return () => overrides.registerAutoSubmit?.(null);
    }
    overrides.registerAutoSubmit(stableInvoker);
    return () => overrides.registerAutoSubmit?.(null);
  }, [enabled, hasHandler, overrides, stableInvoker]);

  return enabled;
}
