import { useMemo, useState } from 'react'
import { useFilteredOrders } from '@/hooks/useFilteredOrders'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { zhCN, enUS } from 'date-fns/locale'

export function ProfitChart() {
    const { t, i18n } = useTranslation()
    const isChinese = i18n.language.startsWith('zh')
    const orders = useFilteredOrders()
    const [range, setRange] = useState(30)

    const data = useMemo(() => {
        const end = new Date()
        const start = subDays(end, range - 1)
        const days = eachDayOfInterval({ start, end })
        const isChinese = i18n.language.startsWith('zh')
        const locale = isChinese ? zhCN : enUS

        return days.map(day => {
            const dayOrders = orders.filter(o => isSameDay(parseISO(o.createdAt), day))
            const profit = dayOrders.reduce((acc, o) => acc + (o.profit || 0), 0)
            return {
                date: format(day, isChinese ? 'MM-dd' : 'MMM dd', { locale }),
                profit: profit
            }
        })
    }, [orders, i18n.language, range])

    const chartTitle = useMemo(() => {
        if (range === 7) return isChinese ? '一周利润趋势' : 'Weekly Profit Trend'
        if (range === 90) return isChinese ? '三个月利润趋势' : 'Three Month Profit Trend'
        return isChinese ? '月度利润趋势' : 'Monthly Profit Trend'
    }, [range, isChinese])

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col border-emerald-500/10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{chartTitle}</h3>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setRange(d)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${range === d
                                ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {d}{i18n.language.startsWith('zh') ? '天' : 'd'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
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
                            tickFormatter={(value) => `¥${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(8px)',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                                color: '#064e3b'
                            }}
                            formatter={(value: any) => [`¥${Number(value || 0).toLocaleString()}`, t('charts.profitStats')]}
                        />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorProfit)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}
