import * as React from "react"
import { cn } from "@/lib/utils"


export function GlassCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn(
            "bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-white/5 shadow-xl shadow-indigo-500/5 rounded-[2rem]",
            className
        )} {...props}>
            {children}
        </div>
    )
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
    size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95",
                    {
                        "bg-primary text-white hover:shadow-lg hover:shadow-primary/25 hover:brightness-110 border-0": variant === "primary",
                        "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-primary backdrop-blur-md border border-slate-200 dark:border-white/10": variant === "secondary",
                        "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400": variant === "ghost",
                        "bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20": variant === "destructive",
                        "border-2 border-slate-200 dark:border-slate-800 hover:border-primary text-slate-600 dark:text-slate-400 hover:text-primary bg-transparent": variant === "outline",
                        "h-9 px-4 text-sm": size === "sm",
                        "h-11 px-6 text-base": size === "md",
                        "h-14 px-8 text-lg": size === "lg",
                        "h-10 w-10 p-0 rounded-xl": size === "icon",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"
