"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    BarChart2,
    CalendarDays,
    ListChecks,
    Gift,
    BookOpen,
    Shield,
    Menu,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const NAV_ITEMS = [
    { href: "/", label: "Home", icon: Home, accent: "from-[#c2f5ff] to-[#6ad7ff]" },
    { href: "/score", label: "Score", icon: BarChart2, accent: "from-[#ffe7c4] to-[#ffb77f]" },
    { href: "/timeline", label: "Timeline", icon: CalendarDays, accent: "from-[#fce0ff] to-[#ff9edc]" },
    { href: "/requirements", label: "Tasks", icon: ListChecks, accent: "from-[#d7ffe6] to-[#6bf2a0]" },
    { href: "/rewards", label: "Rewards", icon: Gift, accent: "from-[#ffe0f1] to-[#ff9ad1]" },
    { href: "/day", label: "Day", icon: CalendarDays, accent: "from-[#ffebb3] to-[#ffb347]" },
    { href: "/journals", label: "Journal", icon: BookOpen, accent: "from-[#e8e4ff] to-[#b2a3ff]" },
    { href: "/admin", label: "Admin", icon: Shield, accent: "from-[#d9f3ff] to-[#9ad7ff]" }
];

export function SidebarMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = (usePathname() || "/").replace(/\/$/, "") || "/";

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Hamburger Button - Fixed Top Left */}
            <motion.button
                onClick={toggleMenu}
                className="fixed top-4 left-4 z-50 rounded-xl p-2 text-white border border-white/30 md:top-6 md:left-6 backdrop-blur-sm"
                aria-label="Toggle Menu"
                style={{
                    background: "linear-gradient(270deg, #ff0f7b, #f89b29, #04142b, #00d4ff)",
                    backgroundSize: "400% 400%"
                }}
                animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    boxShadow: [
                        "0 0 15px rgba(255, 15, 123, 0.5), inset 0 0 10px rgba(255, 15, 123, 0.2)",
                        "0 0 25px rgba(0, 212, 255, 0.7), inset 0 0 15px rgba(0, 212, 255, 0.3)",
                        "0 0 15px rgba(255, 15, 123, 0.5), inset 0 0 10px rgba(255, 15, 123, 0.2)"
                    ],
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                whileHover={{ scale: 1.2, boxShadow: "0 0 30px rgba(255, 255, 255, 0.8)" }}
                whileTap={{ scale: 0.95 }}
            >
                <Menu className="h-6 w-6 md:h-8 md:w-8 drop-shadow-md" />
            </motion.button>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.nav
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#04142b]/95 border-r border-white/10 p-6 shadow-2xl backdrop-blur-xl overflow-y-auto"
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-arcade text-white tracking-widest uppercase bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Menu
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-lg p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
                                    const active = isActive(pathname, href);
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "group flex items-center gap-4 rounded-xl p-3 transition-all",
                                                active
                                                    ? "bg-white/10 text-white shadow-lg border border-white/20"
                                                    : "text-white/60 hover:bg-white/5 hover:text-white hover:pl-4"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-inner",
                                                    accent
                                                )}
                                            >
                                                <Icon className="h-5 w-5 text-[#04142b]" />
                                            </div>
                                            <span className="font-arcade text-sm uppercase tracking-wider">
                                                {label}
                                            </span>
                                            {active && (
                                                <motion.div
                                                    layoutId="active-indicator"
                                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="mt-auto pt-8 border-t border-white/10">
                                <div className="text-[10px] text-white/30 font-arcade text-center">
                                    DAiS System v2.0
                                </div>
                            </div>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </>
    );
}

function isActive(pathname: string, href: string) {
    if (href === "/") {
        return pathname === "/";
    }
    return pathname.startsWith(href);
}
