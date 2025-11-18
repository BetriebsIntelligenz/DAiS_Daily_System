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
    <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-daisy-700 shadow-card">
      <span className="mr-2 inline-flex items-center justify-center rounded-full bg-daisy-500 px-2 py-1 text-white">
        <CheckCircle2 className="h-4 w-4" />
      </span>
      {message}
    </div>
  );
}
