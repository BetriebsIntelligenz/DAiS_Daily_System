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
      <Card className="text-center text-sm text-[#4d5785]">
        Timeline wird geladen…
      </Card>
    );
  }

  if (!entries.length) {
    return (
      <Card className="text-center text-sm text-[#4d5785]">
        Noch keine Aktivitäten vorhanden.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id} className="space-y-3">
          <header className="flex justify-between text-[10px] font-arcade uppercase tracking-[0.3em] text-[#ff679e]">
            <span>
              {new Date(entry.timestamp).toLocaleString("de-DE", {
                dateStyle: "medium",
                timeStyle: "short"
              })}
            </span>
            <span>{entry.category}</span>
          </header>
          <div>
            <h3 className="text-xl font-semibold text-[#0b1230]">
              {entry.title}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-[#4a557f]">
              {entry.details.map((detail) => (
                <li key={detail}>• {detail}</li>
              ))}
            </ul>
          </div>
          <p
            className={`text-right text-lg font-bold ${
              entry.xp.startsWith("-") ? "text-[#ff517b]" : "text-[#18a06b]"
            }`}
          >
            {entry.xp}
          </p>
        </Card>
      ))}
    </div>
  );
}
