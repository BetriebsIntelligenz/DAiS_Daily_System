"use client";

import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { useAuth } from "./auth-gate";

interface TimelineEntry {
  id: string;
  timestamp: string;
  title: string;
  category: string;
  type: string;
  xp: string;
  details: string[];
}

export function TimelineFeed() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setEntries([]);

    const loadEntries = async () => {
      try {
        const response = await fetch(
          `/api/timeline${
            user?.email ? `?email=${encodeURIComponent(user.email)}` : ""
          }`
        );
        const data = await response.json();
        if (active) {
          setEntries(data.entries);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load timeline", error);
      }
    };

    loadEntries();
    const interval = setInterval(loadEntries, 7000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user?.email]);

  if (loading) {
    return (
      <Card className="text-center text-sm text-gray-500">
        Timeline wird geladen…
      </Card>
    );
  }

  if (!entries.length) {
    return (
      <Card className="text-center text-sm text-gray-500">
        Noch keine Aktivitäten vorhanden.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id} className="space-y-3">
          <header className="flex justify-between text-xs uppercase tracking-[0.3em] text-daisy-600">
            <span>
              {new Date(entry.timestamp).toLocaleString("de-DE", {
                dateStyle: "medium",
                timeStyle: "short"
              })}
            </span>
            <span>{entry.category}</span>
          </header>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {entry.title}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {entry.details.map((detail) => (
                <li key={detail}>• {detail}</li>
              ))}
            </ul>
          </div>
          <p
            className={`text-right text-lg font-bold ${
              entry.xp.startsWith("-") ? "text-red-500" : "text-daisy-600"
            }`}
          >
            {entry.xp}
          </p>
        </Card>
      ))}
    </div>
  );
}
