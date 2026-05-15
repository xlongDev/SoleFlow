import { cn } from "@/lib/utils";
import { useConfigStore } from "@/store/useConfigStore";
import { SiteMark } from "@/components/SiteMark";

export function Logo({ className, hideText = false }: { className?: string, hideText?: boolean }) {
    const { logo, brandName } = useConfigStore()

    return (
        <div className={cn("flex items-center gap-3 font-bold text-xl tracking-tight", className)}>
            <div className={cn(
                "bg-gradient-to-br from-indigo-500 to-primary",
                "p-1.5 rounded-2xl text-white shadow-lg shadow-primary/25",
                "transform transition-transform hover:scale-105 duration-300 overflow-hidden flex items-center justify-center",
                logo ? "w-12 h-12 p-0" : "p-2.5"
            )}>
                {logo ? (
                    <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                    <SiteMark className="w-7 h-7 text-white/90" />
                )}
            </div>
            {!hideText && (
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">
                    {brandName || 'SoleFlow'}
                </span>
            )}
        </div>
    )
}
