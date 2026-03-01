"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { usePathname, useRouter } from "next/navigation";

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

function sanitizeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/login")) return "/";
  return value;
}

function parseApiError(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }
  return fallback;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) {
            localStorage.removeItem("daisUser");
            sessionStorage.clear();
            setUser(null);
          }
          return;
        }

        const payload = (await response.json()) as {
          user?: { name?: unknown; email?: unknown };
        };
        const nextUser =
          payload.user &&
          typeof payload.user.name === "string" &&
          typeof payload.user.email === "string"
            ? { name: payload.user.name, email: payload.user.email }
            : null;

        if (!cancelled) {
          if (nextUser) {
            localStorage.setItem("daisUser", JSON.stringify(nextUser));
            setUser(nextUser);
          } else {
            localStorage.removeItem("daisUser");
            sessionStorage.clear();
            setUser(null);
          }
        }
      } catch (requestError) {
        console.error("Session resolve failed", requestError);
        if (!cancelled) {
          localStorage.removeItem("daisUser");
          sessionStorage.clear();
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void resolveSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") {
      const nextPath = pathname ? `${pathname}${window.location.search}` : "/";
      const target = `/login?next=${encodeURIComponent(nextPath)}`;
      router.replace(target);
      return;
    }
    if (user && pathname === "/login") {
      const params = new URLSearchParams(window.location.search);
      const nextPath = sanitizeRedirectPath(params.get("next")) ?? "/";
      router.replace(nextPath);
    }
  }, [loading, pathname, router, user]);

  const logout = useCallback(() => {
    localStorage.removeItem("daisUser");
    sessionStorage.clear();
    setUser(null);
    setError(null);
    void (async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (requestError) {
        console.error("Logout failed", requestError);
      } finally {
        router.replace("/login");
        router.refresh();
      }
    })();
  }, [router]);

  const contextValue = useMemo(
    () => ({
      user,
      logout
    }),
    [logout, user]
  );

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("name") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const enterCode = String(formData.get("enterCode") ?? "").trim();

    if (!username && !password && !enterCode) {
      setError("Bitte Benutzername + Passwort oder einen Entercode eingeben.");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, enterCode })
      });

      const payload = (await response.json().catch(() => null)) as
        | { user?: { name?: unknown; email?: unknown }; error?: unknown }
        | null;

      if (!response.ok) {
        throw new Error(parseApiError(payload, "Login fehlgeschlagen."));
      }

      const nextUser =
        payload?.user &&
        typeof payload.user.name === "string" &&
        typeof payload.user.email === "string"
          ? { name: payload.user.name, email: payload.user.email }
          : null;

      if (!nextUser) {
        throw new Error("Login fehlgeschlagen.");
      }

      localStorage.setItem("daisUser", JSON.stringify(nextUser));
      setUser(nextUser);
      setError(null);
      event.currentTarget.reset();

      const params = new URLSearchParams(window.location.search);
      const nextPath = sanitizeRedirectPath(params.get("next")) ?? "/";
      router.replace(nextPath);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Login fehlgeschlagen."
      );
    }
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
      <div className="flex min-h-[100dvh] w-full flex-col overflow-y-auto bg-gradient-to-b from-[#80dfff]/60 via-[#ffe5f8]/70 to-[#ffd48e]/70 px-6 py-10">
        <form
          onSubmit={handleLogin}
          className="m-auto w-full max-w-md space-y-5 rounded-[38px] border-4 border-white/70 bg-gradient-to-b from-[#142c6c]/80 via-[#273b9a]/85 to-[#6157d5]/80 p-8 text-white shadow-arcade backdrop-blur"
        >
          <header className="text-center">
            <p className="font-arcade text-[11px] uppercase tracking-[0.6em] text-[#f8df7b]">
              DAiS Zugang
            </p>
            <h1 className="mt-3 font-arcade text-2xl tracking-[0.3em]">Einloggen</h1>
          </header>
          <input
            name="name"
            placeholder="Benutzername"
            className="retro-input w-full text-[#0a1435]"
            autoComplete="username"
          />
          <input
            name="password"
            type="password"
            placeholder="Passwort"
            className="retro-input w-full text-[#0a1435]"
            autoComplete="current-password"
          />
          <div className="relative py-1 text-center">
            <span className="text-xs uppercase tracking-[0.25em] text-white/70">oder</span>
          </div>
          <input
            name="enterCode"
            placeholder="Entercode"
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
          <p className="text-center text-xs text-white/70">
            Admin Login: <span className="font-semibold text-white">admin / admin100</span>
          </p>
        </form>
      </div>
    );
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
