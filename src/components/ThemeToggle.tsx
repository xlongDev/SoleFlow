import { motion } from "framer-motion"
import { Moon, Sun, Monitor } from "lucide-react"
import { useThemeStore } from "@/store/useThemeStore"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
    const { theme, setTheme } = useThemeStore()

    return (
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/5 backdrop-blur-md relative">
            {(['light', 'system', 'dark'] as const).map((mode) => (
                <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={cn(
                        "p-2 rounded-full transition-all duration-300 relative z-10",
                        theme === mode
                            ? "text-primary"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    )}
                    title={`Switch to ${mode} mode`}
                >
                    {theme === mode && (
                        <motion.span
                            layoutId="active-theme-tab"
                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full shadow-sm z-[-1]"
                            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                        />
                    )}
                    {mode === 'light' && <Sun size={14} className="stroke-[2.5px]" />}
                    {mode === 'system' && <Monitor size={14} className="stroke-[2.5px]" />}
                    {mode === 'dark' && <Moon size={14} className="stroke-[2.5px]" />}
                </button>
            ))}
        </div>
    )
}
