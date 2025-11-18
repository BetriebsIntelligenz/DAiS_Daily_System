"use client";

import { useState, useRef, useEffect } from "react";
import { UserCircle2 } from "lucide-react";

import { useAuth } from "./auth-gate";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-white transition hover:bg-white/30"
      >
        <UserCircle2 className="h-6 w-6" />
        <span className="hidden text-sm font-semibold md:inline">
          {user.name.split(" ")[0]}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-44 rounded-2xl bg-white py-3 text-sm text-gray-900 shadow-card">
          <div className="px-4 pb-3">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Angemeldet
            </p>
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full px-4 py-2 text-left text-sm font-semibold text-red-500 hover:bg-red-50"
          >
            Logoff
          </button>
        </div>
      )}
    </div>
  );
}
