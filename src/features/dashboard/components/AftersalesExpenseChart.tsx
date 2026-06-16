import { useMemo, useState } from 'react'
import { useOrderStore } from '@/store/useOrderStore'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Cell, BarChart, Bar } from 'recharts'
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { zhCN, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { RefreshCw, BarChart3, TrendingUp } from 'lucide-react'

export function AftersalesExpenseChart() {
    const { t, i18n } = useTranslation()
    const orders = useOrderStore(state => state.orders)
    const [range, setRange] = useState(30)
    const [view, setView] = useState<'trend' | 'reason'>('trend')
    const isChinese = i18n.language.startsWith('zh')
    const locale = isChinese ? zhCN : enUS

    // Calculate today and month aggregated expenses
    const stats = useMemo(() => {
        const now = new Date()
        let todayExpense = 0
        let monthExpense = 0

        orders.forEach(o => {
            const date = parseISO(o.createdAt)
            o.items.forEach(item => {
                const qty = Number(item.quantity || 1)
                const cost = (item.isRefunded ? Number(item.returnCost || 0) : 0) + (item.isExchanged ? Number(item.exchangeCost || 0) : 0)
                const itemTotalCost = cost * qty

                if (isSameDay(date, now)) {
                    todayExpense += itemTotalCost
                }
                if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
                    monthExpense += itemTotalCost
                }
            })
        })

        return { todayExpense, monthExpense }
    }, [orders])

    // Generate daily trend data (Return Cost vs. Exchange Cost)
    const trendData = useMemo(() => {
        const end = new Date()
        const start = subDays(end, range - 1)
        const days = eachDayOfInterval({ start, end })

        return days.map(day => {
            let returnCostTotal = 0
            let exchangeCostTotal = 0

            orders.forEach(o => {
                if (isSameDay(parseISO(o.createdAt), day)) {
                    o.items.forEach(item => {
                        const qty = Number(item.quantity || 1)
                        if (item.isRefunded) {
                            returnCostTotal += Number(item.returnCost || 0) * qty
                        }
                        if (item.isExchanged) {
                            exchangeCostTotal += Number(item.exchangeCost || 0) * qty
                        }
                    })
                }
            })

            return {
                date: format(day, isChinese ? 'MM-dd' : 'MMM dd', { locale }),
                [t('charts.returnExpense')]: returnCostTotal,
                [t('charts.exchangeExpense')]: exchangeCostTotal,
                [t('charts.totalAftersalesExpense')]: returnCostTotal + exchangeCostTotal
            }
        })
    }, [orders, i18n.language, range, t])

    // Generate cost-by-reason breakdown
    const reasonData = useMemo(() => {
        const reasons: Record<string, number> = {}
        orders.forEach(o => {
            o.items.forEach(item => {
                const qty = Number(item.quantity || 1)
                if (item.isRefunded) {
                    const reasonKey = item.refundReason || 'other'
                    const cost = Number(item.returnCost || 0) * qty
                    if (cost > 0) {
                        reasons[reasonKey] = (reasons[reasonKey] || 0) + cost
                    }
                }
                if (item.isExchanged) {
                    const reasonKey = item.exchangeReason || 'other'
                    const cost = Number(item.exchangeCost || 0) * qty
                    if (cost > 0) {
                        reasons[reasonKey] = (reasons[reasonKey] || 0) + cost
                    }
                }
            })
        })

        const data = Object.entries(reasons).map(([key, value]) => ({
            name: t(`orders.refundReasons.${key}` as any) || key,
            value
        }))

        return data.sort((a, b) => b.value - a.value)
    }, [orders, t])

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col relative overflow-hidden group border-white/40 dark:border-white/10 lg:col-span-2">
            {/* Background Icon Watermark */}
            <div className="absolute -right-8 -bottom-8 text-slate-100 dark:text-white/[0.02] -rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
                <RefreshCw size={200} />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                        <RefreshCw size={18} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {t('charts.aftersalesExpenseAnalysis')}
                        </h3>
                        <div className="flex gap-4 mt-1">
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                {isChinese ? '今日支出:' : 'Today:'} 
                                <span className="font-extrabold text-red-500">¥{stats.todayExpense.toLocaleString()}</span>
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                {isChinese ? '本月累计:' : 'Month:'} 
                                <span className="font-extrabold text-blue-500">¥{stats.monthExpense.toLocaleString()}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* View Switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                        <button
                            onClick={() => setView('trend')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                view === 'trend' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                            title={isChinese ? '趋势分析' : 'Trend View'}
                        >
                            <TrendingUp size={16} />
                        </button>
                        <button
                            onClick={() => setView('reason')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                view === 'reason' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                            title={isChinese ? '原因分布' : 'Reason View'}
                        >
                            <BarChart3 size={16} />
                        </button>
                    </div>

                    {/* Range Selection */}
                    {view === 'trend' && (
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                            {[7, 30, 90].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setRange(d)}
                                    className={cn(
                                        "px-2.5 py-1 text-[10px] font-black rounded-lg transition-all",
                                        range === d
                                            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    )}
                                >
                                    {d}{isChinese ? '天' : 'd'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    {view === 'trend' ? (
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorReturnCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExchangeCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickFormatter={(v) => `¥${v}`}
                            />
                            <Tooltip
                                contentStyle={{ 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                    backdropFilter: 'blur(10px)', 
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    color: '#000'
                                }}
                                formatter={(value: any) => [`¥${value}`, '']}
                            />
                            <Area
                                type="monotone"
                                name={t('charts.returnExpense')}
                                dataKey={t('charts.returnExpense')}
                                stroke="#ef4444"
                                strokeWidth={3}
                                stackId="1"
                                fillOpacity={1}
                                fill="url(#colorReturnCost)"
                                animationDuration={800}
                            />
                            <Area
                                type="monotone"
                                name={t('charts.exchangeExpense')}
                                dataKey={t('charts.exchangeExpense')}
                                stroke="#3b82f6"
                                strokeWidth={3}
                                stackId="1"
                                fillOpacity={1}
                                fill="url(#colorExchangeCost)"
                                animationDuration={800}
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={reasonData} layout="vertical" margin={{ left: 20, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" tickFormatter={(v) => `¥${v}`} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                                width={100}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                contentStyle={{ 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                    backdropFilter: 'blur(10px)', 
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    color: '#000'
                                }}
                                formatter={(value: any) => [`¥${value}`, '']}
                            />
                            <Bar 
                                dataKey="value" 
                                radius={[0, 8, 8, 0]} 
                                barSize={20}
                                animationDuration={800}
                            >
                                {reasonData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}
