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
        className="inline-flex items-center gap-3 rounded-2xl border-2 border-white/70 bg-white/10 px-4 py-2 text-sm font-arcade uppercase tracking-[0.3em] text-white transition hover:bg-white/20"
      >
        <UserCircle2 className="h-6 w-6" />
        <span className="hidden md:inline">
          {user.name.split(" ")[0]}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-56 rounded-3xl border-2 border-[#08112c] bg-white/95 p-4 text-sm text-[#0a1230] shadow-arcade">
          <div className="px-4 pb-3">
            <p className="font-arcade text-[10px] uppercase tracking-[0.4em] text-daisy-500">
              Angemeldet
            </p>
            <p className="text-base font-semibold">{user.name}</p>
            <p className="text-xs text-[#4b567c]">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-2xl bg-gradient-to-r from-[#ffbed3] to-[#ff8498] px-4 py-2 text-left text-xs font-arcade uppercase tracking-[0.3em] text-[#5d0b1a] hover:opacity-95"
          >
            Logoff
          </button>
        </div>
      )}
    </div>
  );
}
