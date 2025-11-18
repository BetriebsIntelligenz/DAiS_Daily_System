"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

interface AuthUser {
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  logout: () => undefined
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("daisUser") : null;
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("daisUser");
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("daisUser");
    setUser(null);
  };

  const contextValue = useMemo(
    () => ({
      user,
      logout
    }),
    [user]
  );

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;
    const name = nameInput?.value || "admin";
    const email = `${name.replace(/\s+/g, "").toLowerCase()}@dais.app`;

    if (!password) {
      setError("Bitte Passwort eingeben.");
      return;
    }
    const isPrimaryUser = name.toLowerCase() === "admin";
    const validPassword =
      (isPrimaryUser && password === "Testingit100!") ||
      (!isPrimaryUser && password === "dais2025");
    if (!validPassword) {
      setError("Kennwort ist ungültig.");
      return;
    }

    const authUser: AuthUser = { name, email };
    localStorage.setItem("daisUser", JSON.stringify(authUser));
    setUser(authUser);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff4d6]">
        <p className="text-sm font-semibold text-daisy-700">DAiS lädt…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-daisy-200 to-white px-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-[32px] bg-white p-8 text-gray-900 shadow-soft"
        >
          <header className="space-y-1 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-daisy-500">
              DAiS Zugang
            </p>
            <h1 className="text-3xl font-semibold">Anmelden</h1>
          </header>
          <input
            name="name"
            placeholder="Benutzername"
            className="w-full rounded-2xl border border-daisy-200 px-4 py-3 focus:border-daisy-400 focus:outline-none"
          />
          <input
            name="password"
            type="password"
            placeholder="Passwort"
            className="w-full rounded-2xl border border-daisy-200 px-4 py-3 focus:border-daisy-400 focus:outline-none"
          />
          {error && (
            <p className="text-sm font-semibold text-red-500">{error}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-daisy-400 to-daisy-500 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-card transition hover:opacity-90"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
