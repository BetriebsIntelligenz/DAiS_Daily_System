"use client";

import { useCallback, useEffect, useState } from "react";
import { journalDefinitions } from "@/lib/data";
import { useAuth } from "@/components/auth-gate";
import { Button } from "./ui/button";

interface RoleStateJournalGroup {
  roleId: string;
  roleName: string;
  days: Array<{
    date: string;
    entries: Array<{
      id: string;
      stateId: string;
      stateName?: string | null;
      score: number;
      note?: string | null;
      createdAt: string;
      programCode?: string | null;
      programName?: string | null;
    }>;
  }>;
}

type JournalViewMode = "journal" | "role";

export function JournalBoard() {
  const { user } = useAuth();
  const [activeViewMode, setActiveViewMode] = useState<JournalViewMode>("journal");
  const [activeJournal, setActiveJournal] = useState(journalDefinitions[0]);
  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState<
    { id: string; createdAt: string; contentHtml: string; journalId: string }[]
  >([]);
  const [roleStateGroups, setRoleStateGroups] = useState<RoleStateJournalGroup[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [roleStatesLoading, setRoleStatesLoading] = useState(false);

  const submitEntry = async () => {
    if (!entry) return;
    await fetch("/api/journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        journalId: activeJournal.id,
        content: entry,
        userEmail: user?.email,
        userName: user?.name
      })
    });
    await Promise.all([refreshEntries(), refreshRoleStateJournal()]);
    setEntry("");
    alert("Journal aktualisiert 💛");
  };

  const refreshEntries = useCallback(async () => {
    const response = await fetch("/api/journals");
    const data = await response.json();
    setEntries(data);
  }, []);

  const refreshRoleStateJournal = useCallback(async () => {
    setRoleStatesLoading(true);
    const params = new URLSearchParams();
    if (user?.email) params.set("userEmail", user.email);
    if (user?.name) params.set("userName", user.name);
    const response = await fetch(`/api/roles/state-journal?${params.toString()}`);
    const data = await response.json();
    setRoleStateGroups(Array.isArray(data) ? data : []);
    setRoleStatesLoading(false);
  }, [user?.email, user?.name]);

  useEffect(() => {
    void refreshEntries();
    void refreshRoleStateJournal();
  }, [activeJournal, refreshEntries, refreshRoleStateJournal]);

  useEffect(() => {
    if (roleStateGroups.length === 0) {
      setSelectedRoleId(null);
      return;
    }
    if (selectedRoleId && roleStateGroups.some((group) => group.roleId === selectedRoleId)) {
      return;
    }
    setSelectedRoleId(roleStateGroups[0]?.roleId ?? null);
  }, [roleStateGroups, selectedRoleId]);

  const selectedRoleGroup =
    roleStateGroups.find((group) => group.roleId === selectedRoleId) ?? roleStateGroups[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {journalDefinitions.map((journal) => (
          <Button
            key={journal.id}
            variant={
              activeViewMode === "journal" && activeJournal.id === journal.id
                ? "default"
                : "outline"
            }
            onClick={() => {
              setActiveViewMode("journal");
              setActiveJournal(journal);
            }}
            className={
              activeViewMode === "journal" && activeJournal.id === journal.id
                ? undefined
                : "text-[#0b1230]"
            }
          >
            {journal.name}
          </Button>
        ))}
        <Button
          variant={activeViewMode === "role" ? "default" : "outline"}
          onClick={() => setActiveViewMode("role")}
          className={activeViewMode === "role" ? undefined : "text-[#0b1230]"}
        >
          Role Journal
        </Button>
      </div>

      {activeViewMode === "journal" ? (
        <>
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
        </>
      ) : (
        <section className="rounded-[28px] border-4 border-white/70 bg-white/90 p-4 text-[#0b1230]">
          <header>
            <p className="text-[11px] font-arcade uppercase tracking-[0.35em] text-[#ff5fa8]">
              Role Journal
            </p>
            <h3 className="mt-2 text-xl font-semibold">
              SC State Trackings pro Rolle
            </h3>
            <p className="mt-1 text-sm text-[#4a547f]">
              Automatisch synchronisiert aus dem Rollen-State-Tracking.
            </p>
          </header>

          {roleStatesLoading ? (
            <p className="mt-4 text-sm text-[#4a547f]">Einträge werden geladen...</p>
          ) : roleStateGroups.length === 0 ? (
            <p className="mt-4 text-sm text-[#4a547f]">
              Noch keine Rollen-State-Einträge vorhanden.
            </p>
          ) : (
            <>
              <div className="mt-4 max-w-[320px]">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[#6a739f]">
                  Rolle auswählen
                </label>
                <select
                  value={selectedRoleGroup?.roleId ?? ""}
                  onChange={(event) => setSelectedRoleId(event.target.value)}
                  className="w-full rounded-xl border border-daisy-200 bg-white px-3 py-2 text-sm text-[#0b1230]"
                >
                  {roleStateGroups.map((group) => (
                    <option key={group.roleId} value={group.roleId}>
                      {group.roleName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRoleGroup && (
                <article className="mt-4 rounded-[22px] border-2 border-white/70 bg-white/95 p-3">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2f3763]">
                    {selectedRoleGroup.roleName}
                  </h4>
                  <div className="mt-2 space-y-2">
                    {selectedRoleGroup.days.map((day) => (
                      <div
                        key={`${selectedRoleGroup.roleId}-${day.date}`}
                        className="rounded-xl border border-white/70 bg-white/90 px-3 py-2"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a739f]">
                          {new Date(day.date).toLocaleDateString("de-DE", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })}
                        </p>
                        <ul className="mt-2 space-y-2">
                          {day.entries.map((logEntry) => (
                            <li
                              key={logEntry.id}
                              className="rounded-lg border border-daisy-100 bg-daisy-50/60 px-3 py-2 text-sm"
                            >
                              <p className="font-semibold text-[#0b1230]">
                                {logEntry.stateName ?? "State"}: {logEntry.score}
                              </p>
                              <p className="text-xs text-[#4a547f]">
                                {new Date(logEntry.createdAt).toLocaleTimeString("de-DE", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                                {logEntry.programCode
                                  ? ` · ${logEntry.programCode} (${logEntry.programName ?? "Card"})`
                                  : ""}
                              </p>
                              {logEntry.note && (
                                <p className="mt-1 text-xs text-[#4a547f]">{logEntry.note}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
