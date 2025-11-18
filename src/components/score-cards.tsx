"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp } from "lucide-react";

import { Card, CardDescription, CardTitle } from "./ui/card";
import { useAuth } from "./auth-gate";

interface TimelineSnippet {
  id: string;
  title: string;
  xp: string;
  timestamp: string;
  detail?: string;
}

export function ScoreCards() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    total: number;
    categories: Record<string, number>;
  }>({
    total: 0,
    categories: {}
  });
  const [activities, setActivities] = useState<TimelineSnippet[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [timelineResponse, statsResponse] = await Promise.all([
        fetch("/api/timeline?limit=100"),
        fetch(
          `/api/xp/summary${
            user?.email ? `?email=${encodeURIComponent(user.email)}` : ""
          }`
        )
      ]);
      const timelineData = await timelineResponse.json();
      const statsData = await statsResponse.json();
      setActivities(
        ((timelineData.entries as TimelineSnippet[]) || []).map((entry) => ({
          id: entry.id,
          title: entry.title,
          xp: entry.xp,
          timestamp: entry.timestamp,
          detail: Array.isArray((entry as any).details)
            ? (entry as any).details[0]
            : undefined
        }))
      );
      setStats({
        total: statsData.total ?? 0,
        categories: statsData.categories ?? {}
      });
    };
    load();
  }, [user?.email]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="bg-white">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Trophy className="h-6 w-6 text-daisy-500" />
          {stats.total.toLocaleString()} XP
        </CardTitle>
        <CardDescription>Gesamter Fortschritt</CardDescription>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {Object.entries(stats.categories).map(([category, value]) => (
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
          {(showAll ? activities.slice(0, 100) : activities.slice(0, 3)).map((activity) => (
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
        {activities.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="mt-4 w-full rounded-full border border-daisy-200 py-2 text-sm font-semibold text-daisy-600"
          >
            {showAll ? "Weniger anzeigen" : "Alle anzeigen"}
          </button>
        )}
      </Card>
    </div>
  );
}
