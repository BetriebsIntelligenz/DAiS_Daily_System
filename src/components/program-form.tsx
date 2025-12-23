"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { ProgramDefinition, ProgramExercise } from "@/lib/types";
import { Button } from "./ui/button";
import { useAuth } from "./auth-gate";
import { useProgramCompletionContext } from "@/contexts/program-completion-context";
import { useAutoProgramSubmit } from "@/hooks/use-auto-program-submit";

const buildSchema = (exercises: ProgramExercise[]) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  exercises.forEach((exercise) => {
    switch (exercise.type) {
      case "checkbox":
        shape[exercise.id] = z.boolean().optional();
        break;
      case "scale":
      case "number":
        shape[exercise.id] = z
          .number({ invalid_type_error: "Bitte Zahl eingeben" })
          .min(0)
          .optional();
        break;
      case "multiselect":
        shape[exercise.id] = z.array(z.string()).optional();
        break;
      case "html":
      case "text":
      default:
        shape[exercise.id] = z.string().optional();
        break;
    }
  });
  return z.object(shape);
};

export function ProgramForm({ program }: { program: ProgramDefinition }) {
  const exercises = program.units.flatMap((unit) => unit.exercises);
  const schema = useMemo(() => buildSchema(exercises), [exercises]);
  const router = useRouter();
  const { user } = useAuth();
  const completionOverrides = useProgramCompletionContext();
  const successRedirect =
    completionOverrides?.redirectTo === null
      ? null
      :
        completionOverrides?.redirectTo ??
        `/?programCompleted=${encodeURIComponent(program.name)}`;
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {}
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const response = await fetch("/api/program-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programId: program.id,
        payload: data,
        userEmail: user?.email,
        userName: user?.name
      })
    });
    if (!response.ok) {
      console.error("Programm konnte nicht gebucht werden", await response.json());
      return;
    }
    const result = await response.json();
    console.info("Programmlauf gespeichert", result);
    if (completionOverrides?.onProgramCompleted) {
      await completionOverrides.onProgramCompleted(program);
    }
    form.reset();
    if (successRedirect) {
      router.push(successRedirect);
    }
  });
  const autoSubmitHandler = useCallback(async () => {
    await onSubmit();
  }, [onSubmit]);
  const autoSubmitEnabled = useAutoProgramSubmit(autoSubmitHandler);

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {program.units.map((unit) => (
        <section
          key={unit.id}
          className="rounded-[32px] border-4 border-white/70 bg-white/95 p-6 shadow-[0_20px_45px_rgba(5,18,46,0.2)]"
        >
          <header className="mb-4">
            <h3 className="font-arcade text-base uppercase tracking-[0.4em] text-[#09163d]">
              {unit.title}
            </h3>
            <p className="mt-1 text-sm text-[#4c5680]">
              XP pro Unit:{" "}
              {unit.exercises.reduce((sum, exercise) => sum + exercise.xpValue, 0)}
            </p>
          </header>

          <div className="space-y-4">
            {unit.exercises.map((exercise) => (
              <ExerciseField
                key={exercise.id}
                exercise={exercise}
                register={form.register}
              />
            ))}
          </div>
        </section>
      ))}

      {!autoSubmitEnabled && (
        <Button type="submit" variant="lagoon" className="w-full">
          Programm abschließen & XP buchen
        </Button>
      )}
    </form>
  );
}

function ExerciseField({
  exercise,
  register
}: {
  exercise: ProgramExercise;
  register: UseFormRegister<Record<string, unknown>>;
}) {
  switch (exercise.type) {
    case "checkbox":
      return (
        <label className="flex items-center justify-between rounded-[24px] border-2 border-white/70 bg-white/90 px-4 py-3 text-sm font-semibold text-[#0b1230]">
          <span>{exercise.label}</span>
          <input
            type="checkbox"
            {...register(exercise.id)}
            className="h-5 w-5 rounded border-2 border-[#0b1230] accent-[#ff5fa8]"
          />
        </label>
      );
    case "scale":
      return (
        <label className="flex flex-col gap-2 text-sm font-semibold text-[#0b1230]">
          {exercise.label}
          <input
            type="range"
            min={exercise.config?.scaleMin ?? 1}
            max={exercise.config?.scaleMax ?? 5}
            step={1}
            {...register(exercise.id, { valueAsNumber: true })}
            className="appearance-none rounded-full bg-[#ddebff] accent-[#ff5fa8]"
          />
        </label>
      );
    case "multiselect":
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#0b1230]">{exercise.label}</p>
          <div className="flex flex-wrap gap-2">
            {exercise.config?.options?.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 rounded-full border-2 border-white/70 bg-white/85 px-4 py-1 text-sm"
              >
                <input
                  type="checkbox"
                  value={option}
                  {...register(exercise.id)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      );
    case "number":
      return (
        <label className="flex flex-col gap-2 text-sm font-semibold text-[#0b1230]">
          {exercise.label}
          <input
            type="number"
            {...register(exercise.id, { valueAsNumber: true })}
            className="retro-input bg-white/95 text-[#0b1230]"
          />
        </label>
      );
    case "html":
    case "text":
    default:
      return (
        <label className="flex flex-col gap-2 text-sm font-semibold text-[#0b1230]">
          {exercise.label}
          <textarea
            {...register(exercise.id)}
            placeholder={exercise.config?.placeholder}
            className="retro-input min-h-[120px] bg-white/95 text-[#0b1230]"
          />
        </label>
      );
  }
}
