import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { ProgramDefinition } from "@/lib/types";
import { useAuth } from "@/components/auth-gate";
import { useProgramCompletionContext } from "@/contexts/program-completion-context";

export function useProgramCompletion(program: ProgramDefinition) {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const overrides = useProgramCompletionContext();

  const redirectTarget =
    overrides?.redirectTo === null
      ? null
      : overrides?.redirectTo ?? `/?programCompleted=${encodeURIComponent(program.name)}`;

  const completeProgram = useCallback(
    async (payload: Record<string, unknown>) => {
      setSubmitting(true);
      try {
        const response = await fetch("/api/program-runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programId: program.id,
            payload,
            userEmail: user?.email,
            userName: user?.name
          })
        });

        if (!response.ok) {
          throw new Error("Programm konnte nicht abgeschlossen werden.");
        }

        if (overrides?.onProgramCompleted) {
          await overrides.onProgramCompleted(program);
        }

        if (redirectTarget) {
          router.push(redirectTarget);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setSubmitting(false);
      }
    },
    [
      overrides,
      redirectTarget,
      program,
      router,
      user?.email,
      user?.name
    ]
  );

  return { completeProgram, submitting };
}
