"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface SuccessToastProps {
  message?: string;
  duration?: number;
}

export function SuccessToast({
  message,
  duration = 4000
}: SuccessToastProps) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!message || !visible) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-[#08122f] bg-gradient-to-r from-[#d8ffeb] via-[#f8fdd0] to-[#ffd1f4] px-5 py-3 text-xs font-arcade uppercase tracking-[0.25em] text-[#08122f] shadow-arcade">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#081838] text-white shadow-[0_4px_0_#040c24]">
        <CheckCircle2 className="h-4 w-4" />
      </span>
      {message}
    </div>
  );
}
