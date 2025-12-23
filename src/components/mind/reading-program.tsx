"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  MindReadingBook,
  MindReadingLogEntry,
  ProgramDefinition
} from "@/lib/types";
import { useAuth } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import { SuccessToast } from "@/components/success-toast";
import { useProgramCompletionContext } from "@/contexts/program-completion-context";

interface LogResponse {
  log: MindReadingLogEntry;
  xpEarned?: number;
}

export function ReadingProgram({ program }: { program: ProgramDefinition }) {
  const router = useRouter();
  const auth = useAuth();
  const completionOverrides = useProgramCompletionContext();
  const [books, setBooks] = useState<MindReadingBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [pagesValue, setPagesValue] = useState("10");
  const [logs, setLogs] = useState<MindReadingLogEntry[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const successRedirect =
    completionOverrides?.redirectTo === null
      ? null
      : completionOverrides?.redirectTo ??
        `/?programCompleted=${encodeURIComponent(program.name)}`;

  const loadBooks = useCallback(async () => {
    setLoadingBooks(true);
    try {
      const response = await fetch("/api/mind/reading/books");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Bücher konnten nicht geladen werden.");
      }
      const payload = await response.json();
      const list = Array.isArray(payload?.books)
        ? (payload.books as MindReadingBook[])
        : Array.isArray(payload)
          ? (payload as MindReadingBook[])
          : [];
      setBooks(list);
      setError(null);
    } catch (requestError) {
      console.error(requestError);
      setBooks([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Bücher konnten nicht geladen werden."
      );
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch("/api/mind/reading/logs");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Verlauf konnte nicht geladen werden.");
      }
      const payload = await response.json();
      const list = Array.isArray(payload?.logs)
        ? (payload.logs as MindReadingLogEntry[])
        : [];
      setLogs(list);
      setError(null);
    } catch (requestError) {
      console.error(requestError);
      setLogs([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Verlauf konnte nicht geladen werden."
      );
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? null,
    [books, selectedBookId]
  );

  useEffect(() => {
    void loadBooks();
    void loadLogs();
  }, [loadBooks, loadLogs]);

  useEffect(() => {
    if (selectedBookId || books.length === 0) return;
    const firstActive = books.find((book) => book.isActive);
    setSelectedBookId(firstActive?.id ?? books[0]?.id ?? "");
  }, [books, selectedBookId]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedBookId) {
        setError("Bitte ein Buch auswählen.");
        return;
      }
      const parsedPages = Number(pagesValue);
      if (!Number.isFinite(parsedPages) || parsedPages <= 0) {
        setError("Bitte eine gültige Seitenzahl eintragen.");
        return;
      }

      setSaving(true);
      setError(null);
      try {
        const response = await fetch("/api/mind/reading/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: selectedBookId,
            pages: parsedPages,
            userEmail: auth.user?.email,
            userName: auth.user?.name
          })
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Leselog konnte nicht gespeichert werden.");
        }
        const payload = (await response.json()) as LogResponse;
        setPagesValue("10");
        setToastMessage(
          payload?.xpEarned
            ? `Leselog gespeichert (+${payload.xpEarned} XP)`
            : "Leselog gespeichert"
        );
        await loadLogs();
        if (completionOverrides?.onProgramCompleted) {
          await completionOverrides.onProgramCompleted(program);
        }
        if (successRedirect) {
          router.push(successRedirect);
        }
      } catch (requestError) {
        console.error(requestError);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Leselog konnte nicht gespeichert werden."
        );
      } finally {
        setSaving(false);
      }
    },
    [
      auth.user?.email,
      auth.user?.name,
      completionOverrides,
      loadLogs,
      pagesValue,
      program,
      router,
      selectedBookId,
      successRedirect
    ]
  );

  return (
    <div className="space-y-6">
      <section className="retro-panel p-6">
        <header className="space-y-2">
          <p className="text-xs font-arcade uppercase tracking-[0.4em] text-[#6f78aa]">
            Mind · Lesen
          </p>
          <h2 className="text-2xl font-semibold text-[#0b1230]">Leselog</h2>
          <p className="text-sm text-[#4b5685]">
            Buch auswählen, Seiten eintragen und dein tägliches Lesen dokumentieren.
          </p>
        </header>
        {error && (
          <div className="mt-4 rounded-[22px] border-4 border-[#ffd1e8] bg-[#fff5f9] px-4 py-3 text-sm text-[#7a264e]">
            {error}
          </div>
        )}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6f78aa]">
              Buch
            </label>
            {loadingBooks ? (
              <p className="mt-2 text-sm text-[#4b5685]">Bücher werden geladen…</p>
            ) : books.length === 0 ? (
              <p className="mt-2 text-sm text-[#4b5685]">
                Keine Bücher vorhanden. Bitte im Admin &ldquo;Cards&rdquo; Bereich hinzufügen.
              </p>
            ) : (
              <select
                value={selectedBookId}
                onChange={(event) => setSelectedBookId(event.target.value)}
                className="mt-2 w-full rounded-2xl border-2 border-white/70 bg-white/95 px-4 py-3 text-[#0b1230] shadow-inner focus:border-[#ff9edc]"
              >
                <option value="" disabled>
                  Buch auswählen
                </option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                    {book.author ? ` — ${book.author}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6f78aa]">
              Gelesene Seiten
            </label>
            <input
              type="number"
              min={1}
              value={pagesValue}
              onChange={(event) => setPagesValue(event.target.value)}
              className="mt-2 w-full rounded-2xl border-2 border-white/70 bg-white/95 px-4 py-3 text-[#0b1230] shadow-inner focus:border-[#ff9edc]"
              placeholder="z. B. 25"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={saving || !selectedBook || books.length === 0}
          >
            {saving ? "Speichert…" : "Eintrag hinzufügen"}
          </Button>
        </form>
      </section>

      <section className="retro-panel p-6">
        <details open className="rounded-[24px] border-4 border-white/70 bg-white/95 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#0b1230]">
            Leselog ({logs.length})
          </summary>
          <div className="mt-3 space-y-3 text-sm text-[#4b5685]">
            {loadingLogs && <p>Einträge werden geladen…</p>}
            {!loadingLogs && logs.length === 0 && (
              <p>Noch keine Leselog Einträge vorhanden.</p>
            )}
            {!loadingLogs &&
              logs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-[22px] border-2 border-white/70 bg-white/90 px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ff5fa8]">
                    {new Date(log.createdAt).toLocaleString("de-DE", {
                      dateStyle: "short",
                      timeStyle: "short"
                    })}
                  </p>
                  <p className="font-semibold text-[#0b1230]">{log.bookTitle}</p>
                  <p className="text-sm text-[#4b5685]">+{log.pages} Seiten</p>
                </article>
              ))}
          </div>
        </details>
      </section>
      <SuccessToast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
