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
            className={
              activeJournal.id === journal.id
                ? undefined
                : "text-[#0b1230]"
            }
          >
            {journal.name}
          </Button>
        ))}
      </div>

      <textarea
        className="retro-input min-h-[220px] w-full rounded-[24px] border-4 border-white/60 bg-white/95 text-[#0a1435]"
        placeholder="Neue Erkenntnis hinzufügen..."
        value={entry}
        onChange={(event) => setEntry(event.target.value)}
      />

      <Button variant="lagoon" onClick={submitEntry} className="w-full">
        Eintrag sichern
      </Button>

      <div className="space-y-4">
        {entries
          .filter((entryBlock) => entryBlock.journalId === activeJournal.id)
          .map((entryBlock) => (
            <article
              key={entryBlock.id}
              className="space-y-2 rounded-[28px] border-4 border-white/70 bg-white/90 p-4 text-[#0b1230]"
            >
              <p className="text-[11px] font-arcade uppercase tracking-[0.35em] text-[#ff5fa8]">
                {new Date(entryBlock.createdAt).toLocaleString("de-DE")}
              </p>
              <div
                className="prose max-w-none text-[#2f3763]"
                dangerouslySetInnerHTML={{ __html: entryBlock.contentHtml }}
              />
            </article>
          ))}
        {!entries.filter((entryBlock) => entryBlock.journalId === activeJournal.id)
          .length && (
          <p className="text-sm text-[#4a547f]">
            Noch keine Einträge für dieses Journal.
          </p>
        )}
      </div>
    </div>
  );
}
