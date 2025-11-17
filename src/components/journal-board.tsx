"use client";

import { useEffect, useState } from "react";
import { journalDefinitions } from "@/lib/data";
import { Button } from "./ui/button";

export function JournalBoard() {
  const [activeJournal, setActiveJournal] = useState(journalDefinitions[0]);
  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState<
    { id: string; createdAt: string; contentHtml: string; journalId: string }[]
  >([]);

  const submitEntry = async () => {
    if (!entry) return;
    await fetch("/api/journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        journalId: activeJournal.id,
        content: entry
      })
    });
    await refreshEntries();
    setEntry("");
    alert("Journal aktualisiert 💛");
  };

  const refreshEntries = async () => {
    const response = await fetch("/api/journals");
    const data = await response.json();
    setEntries(data);
  };

  useEffect(() => {
    refreshEntries();
  }, [activeJournal]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {journalDefinitions.map((journal) => (
          <Button
            key={journal.id}
            variant={
              activeJournal.id === journal.id ? "default" : "outline"
            }
            onClick={() => setActiveJournal(journal)}
          >
            {journal.name}
          </Button>
        ))}
      </div>

      <textarea
        className="min-h-[200px] w-full rounded-3xl border border-daisy-200 bg-white/90 p-4"
        placeholder="Neue Erkenntnis hinzufügen..."
        value={entry}
        onChange={(event) => setEntry(event.target.value)}
      />

      <Button onClick={submitEntry} className="w-full">
        Eintrag sichern
      </Button>

      <div className="space-y-4">
        {entries
          .filter((entryBlock) => entryBlock.journalId === activeJournal.id)
          .map((entryBlock) => (
            <article
              key={entryBlock.id}
              className="space-y-2 rounded-3xl border border-daisy-100 bg-white/70 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-daisy-600">
                {new Date(entryBlock.createdAt).toLocaleString("de-DE")}
              </p>
              <div
                className="prose max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: entryBlock.contentHtml }}
              />
            </article>
          ))}
        {!entries.filter((entryBlock) => entryBlock.journalId === activeJournal.id)
          .length && (
          <p className="text-sm text-gray-500">
            Noch keine Einträge für dieses Journal.
          </p>
        )}
      </div>
    </div>
  );
}
