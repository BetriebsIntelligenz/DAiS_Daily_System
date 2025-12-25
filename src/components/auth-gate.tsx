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
    // TEMPORARY: Auto-login bypass
    const devUser = { name: "Dev", email: "dev@dais.app" };
    setUser(devUser);
    setLoading(false);

    // Original Logic (Commented out)
    // const stored = typeof window !== "undefined" ? localStorage.getItem("daisUser") : null;
    // if (stored) {
    //   try {
    //     setUser(JSON.parse(stored));
    //   } catch {
    //     localStorage.removeItem("daisUser");
    //   }
    // }
    // setLoading(false);
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-lagoon-200/40 to-daisy-100/60">
        <div className="insert-coin-panel text-[#552310]">
          Loading
          <div className="insert-coin-slot mt-4" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#80dfff]/60 via-[#ffe5f8]/70 to-[#ffd48e]/70 px-6 py-10">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md space-y-5 rounded-[38px] border-4 border-white/70 bg-gradient-to-b from-[#142c6c]/80 via-[#273b9a]/85 to-[#6157d5]/80 p-8 text-white shadow-arcade backdrop-blur"
        >
          <header className="text-center">
            <p className="font-arcade text-[11px] uppercase tracking-[0.6em] text-[#f8df7b]">
              DAiS Zugang
            </p>
            <h1 className="mt-3 font-arcade text-2xl tracking-[0.3em]">
              Einloggen
            </h1>
          </header>
          <input
            name="name"
            placeholder="Benutzername"
            className="retro-input w-full text-[#0a1435]"
          />
          <input
            name="password"
            type="password"
            placeholder="Passwort"
            className="retro-input w-full text-[#0a1435]"
          />
          {error && (
            <p className="rounded-2xl bg-white/20 px-4 py-2 text-center text-sm font-semibold text-[#ffb7c5]">
              {error}
            </p>
          )}
          <button type="submit" className="pixel-button w-full py-3">
            Start
          </button>
        </form>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
