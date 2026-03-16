import { Outlet, NavLink, useLocation } from "react-router-dom"
import { LayoutDashboard, ShoppingBag, Calendar, Settings, PackagePlus, Github } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Logo } from "@/components/Logo"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"

export function DashboardLayout() {
    const location = useLocation()
    const { t } = useTranslation()

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.dashboard'), path: "/" },
        { icon: ShoppingBag, label: t('nav.orders'), path: "/orders" },
        { icon: PackagePlus, label: t('nav.newOrder'), path: "/orders/new" },
        { icon: Calendar, label: t('nav.calendar'), path: "/calendar" },
        { icon: Settings, label: t('nav.settings'), path: "/settings" },
    ]

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans selection:bg-primary/20">

            {/* Background Blobs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-blob" />
                <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-indigo-500/10 rounded-full blur-[120px] animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10 flex h-screen p-4 gap-4">
                {/* Sidebar */}
                <aside className="w-72 hidden md:flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5">
                    <div className="p-8">
                        <Logo />
                    </div>

                    <nav className="flex-1 px-6 space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === '/orders' || item.path === '/'}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                                        isActive
                                            ? "bg-primary text-white shadow-lg shadow-primary/25"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive && "fill-white/20")} />
                                    <span className="font-medium tracking-wide">{item.label}</span>
                                </NavLink>
                            )
                        })}
                    </nav>

                    <div className="p-6">
                        <div className="p-2 rounded-3xl bg-slate-100/50 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center gap-4">
                            <a 
                                href="https://github.com/xlongDev/SoleFlow" 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 rounded-full text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 hover:shadow-sm"
                                title="View on GitHub"
                            >
                                <Github size={18} />
                            </a>
                            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                            <ThemeToggle />
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5 overflow-hidden relative">
                    <div className="h-full overflow-y-auto overflow-x-hidden p-6 md:p-10 scrollbar-hide">

                        {/* Mobile Header */}
                        <header className="md:hidden flex items-center justify-between mb-8">
                            <Logo />
                            <div className="flex items-center gap-3">
                                <a 
                                    href="https://github.com/xlongDev/SoleFlow" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                                >
                                    <Github size={18} />
                                </a>
                                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                                <ThemeToggle />
                            </div>
                        </header>

                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    )
}
