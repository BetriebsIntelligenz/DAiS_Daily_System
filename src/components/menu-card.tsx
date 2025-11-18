import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Activity,
  Users2,
  Leaf,
  Briefcase,
  Sparkles
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "./ui/card";

interface MenuCardProps {
  title: string;
  description: string;
  href: string;
  accent: string;
  chips?: string[];
}

const iconMap: Record<string, React.ReactNode> = {
  mind: <Brain className="h-8 w-8" />,
  body: <Activity className="h-8 w-8" />,
  human: <Users2 className="h-8 w-8" />,
  environment: <Leaf className="h-8 w-8" />,
  business: <Briefcase className="h-8 w-8" />
};

export function MenuCard({
  title,
  description,
  href,
  accent,
  chips = []
}: MenuCardProps) {
  const icon = iconMap[title.toLowerCase()] ?? (
    <Sparkles className="h-8 w-8" />
  );

  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "relative overflow-hidden border-none bg-white p-0 text-gray-900 shadow-card transition hover:-translate-y-1",
          accent
        )}
      >
        <div className="card-gradient flex h-28 w-full items-center justify-between rounded-t-[28px] px-5 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/80">
              Kategorie
            </p>
            <h3 className="text-2xl font-semibold">{title}</h3>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-white">{icon}</div>
        </div>
        <div className="-mt-5 space-y-4 rounded-[28px] bg-white p-5">
          <p className="text-sm text-gray-600">{description}</p>
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
          <div className="flex items-center justify-end text-daisy-600">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
