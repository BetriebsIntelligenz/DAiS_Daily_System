"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp } from "lucide-react";

import { Card, CardDescription, CardTitle } from "./ui/card";

interface ScoreCardProps {
  totalXp: number;
  categoryXp: Record<string, number>;
}

interface TimelineSnippet {
  id: string;
  title: string;
  xp: string;
  timestamp: string;
  detail?: string;
}

export function ScoreCards({ totalXp, categoryXp }: ScoreCardProps) {
  const [activities, setActivities] = useState<TimelineSnippet[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/timeline");
      const data = await response.json();
      setActivities(
        (data.entries as TimelineSnippet[]).slice(0, 3).map((entry) => ({
          id: entry.id,
          title: entry.title,
          xp: entry.xp,
          timestamp: entry.timestamp,
          detail: Array.isArray((entry as any).details)
            ? (entry as any).details[0]
            : undefined
        }))
      );
    };
    load();
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="bg-white">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Trophy className="h-6 w-6 text-daisy-500" />
          {totalXp.toLocaleString()} XP
        </CardTitle>
        <CardDescription>Gesamter Fortschritt</CardDescription>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {Object.entries(categoryXp).map(([category, value]) => (
            <div key={category} className="rounded-2xl bg-daisy-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-daisy-700">
                {category}
              </p>
              <p className="text-lg font-semibold text-gray-900">{value} XP</p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-5 w-5 text-daisy-500" />
          Letzte Aktivitäten
        </CardTitle>
        <CardDescription>
          Zeigt direkt die letzten Programm-, Journal- oder Reward-Aktivitäten.
        </CardDescription>
        <ul className="mt-4 space-y-3 text-sm">
          {activities.length === 0 && (
            <li className="text-gray-500">Noch keine Aktivitäten vorhanden.</li>
          )}
          {activities.map((activity) => (
            <li key={activity.id} className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">
                  {activity.title}
                </span>
                <span
                  className={`font-semibold ${
                    activity.xp.startsWith("-")
                      ? "text-red-500"
                      : "text-daisy-600"
                  }`}
                >
                  {activity.xp}
                </span>
              </div>
              {activity.detail && (
                <p className="text-xs text-gray-500">{activity.detail}</p>
              )}
              <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">
                {new Date(activity.timestamp).toLocaleString("de-DE", {
                  dateStyle: "short",
                  timeStyle: "short"
                })}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
