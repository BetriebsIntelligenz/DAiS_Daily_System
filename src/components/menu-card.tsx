import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "./ui/card";

interface MenuCardProps {
  title: string;
  description: string;
  href: string;
  accent: string;
  chips?: string[];
}

export function MenuCard({
  title,
  description,
  href,
  accent,
  chips = []
}: MenuCardProps) {
  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "relative overflow-hidden border-none bg-white p-0 text-gray-900 shadow-card transition hover:-translate-y-1",
          accent
        )}
      >
        <div className="card-gradient h-24 w-full rounded-t-[28px]" />
        <div className="-mt-10 space-y-4 rounded-[28px] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-daisy-500">
                {chips[0] ?? "FLOW"}
              </p>
              <h3 className="mt-1 text-2xl font-semibold">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-daisy-500" />
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.slice(0, 3).map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-daisy-50 px-3 py-1 text-xs font-semibold text-daisy-600"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
