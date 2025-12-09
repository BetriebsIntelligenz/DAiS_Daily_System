"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { programDefinitions } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { MobileShell } from "@/components/mobile-shell";

export default function ProgramsPage() {
  const searchParams = useSearchParams();
  const category = searchParams?.get("category") ?? null;

  const programs = useMemo(() => {
    if (!category) return programDefinitions;
    return programDefinitions.filter((program) => program.category === category);
  }, [category]);

  return (
    <MobileShell
      title="Programme"
      description="Alle konfigurierten Flows aus den DAiS Dokumenten."
    >
      <div className="grid gap-6">
        {programs.map((program) => (
          <Link key={program.id} href={`/programs/${program.slug}`}>
            <Card className="transition hover:-translate-y-1 hover:shadow-xl">
              <div>
                <Badge>{program.category}</Badge>
                <CardTitle className="mt-2 flex items-center gap-2">
                  {program.code} — {program.name}
                </CardTitle>
                <CardDescription>{program.summary}</CardDescription>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
