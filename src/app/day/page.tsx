"use client";

import { useEffect, useState, useMemo } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { HOUSEHOLD_WEEKDAYS, formatWeekday } from "@/lib/household";
import { ChevronDown, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProgramStackDefinition } from "@/lib/types";

export default function DayPage() {
    const [selectedWeekday, setSelectedWeekday] = useState<number>(() => {
        // JS getDay(): 0 = Sunday, 1 = Monday.
        // HOUSEHOLD: 1 = Monday, ..., 7 = Sunday.
        const day = new Date().getDay();
        return day === 0 ? 7 : day;
    });

    const [stacks, setStacks] = useState<ProgramStackDefinition[]>([]);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetch("/api/program-stacks")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setStacks(data);
                }
            })
            .catch((err) => console.error("Failed to load stacks", err));
    }, []);

    const currentDayStacks = useMemo(() => {
        return stacks.filter((stack) => {
            // Check if stack is active for this weekday
            return stack.weekdays && stack.weekdays.includes(selectedWeekday);
        });
    }, [stacks, selectedWeekday]);

    // Calculations for positioning
    // 1440 minutes in a day.
    // Scale: 2px per minute? That's 2880px height. Maybe 1.5px? Or just 80px per hour (~1.33px/min).
    const PIXELS_PER_HOUR = 120;
    const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

    const getTopOffset = (timeStr: string) => {
        const [h, m] = timeStr.split(":").map(Number);
        return (h * 60 + m) * PIXELS_PER_MINUTE;
    };

    const getDurationHeight = (minutes: number) => {
        return minutes * PIXELS_PER_MINUTE;
    };

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const liveIndicatorTop = currentMinutes * PIXELS_PER_MINUTE;

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <MobileShell
            title="Tagesansicht"
            description="Dein Tagesplan im Überblick."
        >
            <div className="flex flex-col gap-6">
                {/* Weekday Selector */}
                <div className="relative z-20">
                    <label className="mb-2 block text-xs font-arcade uppercase tracking-widest text-slate-500">
                        Wochentag
                    </label>
                    <div className="relative">
                        <select
                            value={selectedWeekday}
                            onChange={(e) => setSelectedWeekday(Number(e.target.value))}
                            className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-arcade text-lg uppercase tracking-wider text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        >
                            {HOUSEHOLD_WEEKDAYS.map((day) => (
                                <option key={day.value} value={day.value}>
                                    {day.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* Timeline Container */}
                <div className="relative overflow-hidden rounded-[32px] border-4 border-white/60 bg-white/40 shadow-inner backdrop-blur-sm">
                    <div
                        className="relative w-full overflow-y-auto"
                        style={{ height: "600px" }} // Fixed height scrollable area
                    >
                        {/* Time Grid */}
                        <div
                            className="relative w-full bg-[linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:100%_60px]"
                            style={{ height: `${24 * PIXELS_PER_HOUR}px` }}
                        >
                            {hours.map((hour) => (
                                <div
                                    key={hour}
                                    className="absolute left-0 w-full border-t border-slate-200/50 text-xs font-semibold text-slate-400"
                                    style={{ top: hour * PIXELS_PER_HOUR, height: PIXELS_PER_HOUR }}
                                >
                                    <span className="absolute -top-3 left-3 bg-white/50 px-1 backdrop-blur-sm rounded">
                                        {hour.toString().padStart(2, '0')}:00
                                    </span>
                                    {/* 30 min marker */}
                                    <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-slate-100" />
                                </div>
                            ))}

                            {/* Live Indicator */}
                            {/* Only show if selected weekday matches today */}
                            {(new Date().getDay() === 0 ? 7 : new Date().getDay()) === selectedWeekday && (
                                <div
                                    className="absolute left-0 z-30 flex w-full items-center"
                                    style={{ top: liveIndicatorTop }}
                                >
                                    <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                    <div className="h-0.5 w-full bg-red-500/50 shadow-[0_0_4px_rgba(239,68,68,0.3)]" />
                                    <span className="absolute right-2 -top-6 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                        {now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            )}

                            {/* Stacks */}
                            {currentDayStacks.map((stack) => {
                                // Determine start time: either from `startTimes` map or generic `startTime`
                                let startTime = stack.startTime;
                                // If specific start time for this weekday exists, prefer it? 
                                // The User Request in previous turn implied "startTimes" object support.
                                // "startTimes" is Record<string, string> where key is weekday value.
                                if (stack.startTimes && (stack.startTimes as any)[selectedWeekday]) {
                                    startTime = (stack.startTimes as any)[selectedWeekday];
                                }

                                if (!startTime || !stack.durationMinutes) return null;

                                const top = getTopOffset(startTime);
                                const height = getDurationHeight(stack.durationMinutes);

                                return (
                                    <Link
                                        key={stack.id}
                                        href={`/programs/stacks/${stack.slug}`}
                                        className="absolute left-16 right-2 z-10 block overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2 text-white shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                                        style={{
                                            top,
                                            height: Math.max(height, 40) // Min height for visibility
                                        }}
                                    >
                                        <div className="flex h-full w-full items-center gap-3 px-1">
                                            <div className="flex-1 min-w-0 font-arcade text-sm uppercase tracking-wider truncate font-bold">
                                                {stack.title}
                                            </div>
                                            <div className="flex-shrink-0 flex items-center gap-2 text-[10px] opacity-90 font-medium whitespace-nowrap">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {startTime} - {(() => {
                                                        const [h, m] = startTime!.split(":").map(Number);
                                                        const end = new Date();
                                                        end.setHours(h, m + stack.durationMinutes!);
                                                        return end.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
                                                    })()}
                                                </span>
                                                <span className="hidden sm:inline">•</span>
                                                <span>{stack.durationMinutes} Min</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </MobileShell>
    );
}
