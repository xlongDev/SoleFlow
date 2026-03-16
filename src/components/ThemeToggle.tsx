import { Moon, Sun, Monitor } from "lucide-react"
import { useThemeStore } from "@/store/useThemeStore"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
    const { theme, setTheme } = useThemeStore()

    return (
        <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-full border border-white/10 dark:border-white/5 backdrop-blur-md shadow-inner">
            {(['light', 'system', 'dark'] as const).map((mode) => (
                <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={cn(
                        "p-2 rounded-full transition-all duration-300 relative z-10",
                        theme === mode
                            ? "bg-white dark:bg-zinc-800 text-primary shadow-lg scale-105 ring-1 ring-black/5"
                            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                    title={`Switch to ${mode} mode`}
                >
                    {mode === 'light' && <Sun size={14} className="stroke-[2.5px]" />}
                    {mode === 'system' && <Monitor size={14} className="stroke-[2.5px]" />}
                    {mode === 'dark' && <Moon size={14} className="stroke-[2.5px]" />}
                </button>
            ))}
        </div>
    )
}
