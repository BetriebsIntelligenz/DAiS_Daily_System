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
        fetch(
          `/api/timeline?limit=100${user?.email ? `&email=${encodeURIComponent(user.email)}` : ""
          }`
        ),
        fetch(
          `/api/xp/summary${user?.email ? `?email=${encodeURIComponent(user.email)}` : ""
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
        total: statsData.totalEarned ?? statsData.total ?? 0,
        categories: statsData.categories ?? {}
      });
    };
    load();
  }, [user?.email]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="bg-white/95">
        <CardTitle className="flex items-center gap-2 text-xl">
          <span className="inline-flex aspect-square w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffe39e] to-[#ff9edc] text-[#3d0c2a] shadow-[0_6px_0_rgba(63,12,42,0.35)]">
            <Trophy className="h-5 w-5" />
          </span>
          {stats.total.toLocaleString()} XP
        </CardTitle>
        <CardDescription className="mt-2 text-xs font-semibold uppercase tracking-[0.3em]">
          Gesamter Fortschritt
        </CardDescription>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {Object.entries(stats.categories).map(([category, value]) => (
            <div
              key={category}
              className="rounded-2xl border-2 border-white/70 bg-gradient-to-r from-[#d5f2ff] via-[#ffe695] to-[#ffd65c] px-3 py-2 text-[#0b1230]"
            >
              <p className="text-[10px] font-arcade uppercase tracking-[0.4em] text-[#36528f]">
                {category}
              </p>
              <p className="text-lg font-semibold">{value} XP</p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle className="flex items-center gap-2 text-xl">
          <span className="inline-flex aspect-square w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#bfe4ff] to-[#5d9bff] text-[#08102b] shadow-[0_6px_0_rgba(8,16,43,0.3)]">
            <TrendingUp className="h-5 w-5" />
          </span>
          Letzte Aktivitäten
        </CardTitle>
        <CardDescription>
          Zeigt direkt die letzten Programm-, Journal- oder Reward-Aktivitäten.
        </CardDescription>
        <ul className="mt-4 space-y-3 text-sm">
          {activities.length === 0 && (
            <li className="text-[#5b668f]">Noch keine Aktivitäten vorhanden.</li>
          )}
          {(showAll ? activities.slice(0, 100) : activities.slice(0, 3)).map((activity) => (
            <li key={activity.id} className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="font-semibold text-[#091437]">
                  {activity.title}
                </span>
                <span
                  className={`font-semibold ${activity.xp.startsWith("-")
                      ? "text-[#ff5474]"
                      : "text-[#24a985]"
                    }`}
                >
                  {activity.xp}
                </span>
              </div>
              {activity.detail && (
                <p className="text-xs text-[#4b567c]">{activity.detail}</p>
              )}
              <p className="text-[10px] font-arcade uppercase tracking-[0.3em] text-[#6d74a8]">
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
            className="mt-4 w-full rounded-2xl border-2 border-white/70 bg-gradient-to-r from-[#dbf8ff] to-[#ffd5fb] py-2 text-xs font-arcade uppercase tracking-[0.3em] text-[#0a1735]"
          >
            {showAll ? "Weniger anzeigen" : "Alle anzeigen"}
          </button>
        )}
      </Card>
    </div>
  );
}
