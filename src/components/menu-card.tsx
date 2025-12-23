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
  chips = []
}: MenuCardProps) {
  const icon = iconMap[title.toLowerCase()] ?? (
    <Sparkles className="h-8 w-8" />
  );

  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "relative overflow-hidden border-none bg-white/95 p-0 text-[#091437] shadow-arcade transition hover:-translate-y-1.5"
        )}
      >
        <div className="relative flex h-32 w-full items-center justify-between bg-gradient-to-r from-[#273fa1] via-[#7d5cc6] to-[#ff9edc] px-6 text-white">
          <div>
            <p className="font-arcade text-[10px] uppercase tracking-[0.5em] text-white/70">
              Programm
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-wide">
              {title}
            </h3>
          </div>
          <div className="rounded-2xl border-2 border-white/70 bg-white/15 p-3 text-white shadow-[0_8px_0_rgba(0,0,0,0.15)]">
            {icon}
          </div>
        </div>
        <div className="-mt-6 space-y-4 rounded-[26px] border-4 border-white/70 bg-white p-6 shadow-[0_12px_30px_rgba(44,64,130,0.25)]">
          <p className="text-sm text-[#2b3661]">{description}</p>
          <div className="flex flex-wrap gap-2">
            {chips.slice(0, 3).map((chip) => (
              <span
                key={chip}
                className="rounded-xl border-2 border-[#101a3b]/10 bg-[#fef4ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#6f2a73]"
              >
                {chip}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-end text-[#ff5499]">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
