import { useMemo, useState } from 'react'
import { useFilteredOrders } from '@/hooks/useFilteredOrders'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { format, subDays, eachDayOfInterval, isSameDay, parseISO, differenceInHours } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { zhCN, enUS } from 'date-fns/locale'

export function ShippingSpeedChart() {
    const { i18n } = useTranslation()
    const orders = useFilteredOrders()
    const [range, setRange] = useState(7)
    const isChinese = i18n.language.startsWith('zh')

    const data = useMemo(() => {
        const end = new Date()
        const start = subDays(end, range - 1)
        const days = eachDayOfInterval({ start, end })
        const locale = isChinese ? zhCN : enUS

        return days.map(day => {
            const shippedOnDay = orders.filter(o =>
                o.shippedAt && isSameDay(parseISO(o.shippedAt), day)
            )

            let avgHours = 0
            if (shippedOnDay.length > 0) {
                const totalHours = shippedOnDay.reduce((acc, o) => {
                    const start = parseISO(o.createdAt)
                    const end = parseISO(o.shippedAt!)
                    return acc + Math.max(0, differenceInHours(end, start))
                }, 0)
                avgHours = Math.round(totalHours / shippedOnDay.length)
            }

            return {
                date: format(day, isChinese ? 'MM-dd' : 'MMM dd', { locale }),
                hours: avgHours,
            }
        })
    }, [orders, i18n.language, range])

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {isChinese ? '发货时效分析' : 'Shipping Speed Analysis'}
                    </h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                        {isChinese ? '平均发货用时（小时）' : 'Avg. Hours to Ship'}
                    </p>
                </div>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setRange(d)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${range === d
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {d}{isChinese ? '天' : 'd'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickFormatter={(value) => `${value}h`}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(8px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                        />
                        <Bar
                            dataKey="hours"
                            radius={[6, 6, 0, 0]}
                            barSize={30}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.hours > 48 ? '#ef4444' : entry.hours > 24 ? '#f59e0b' : '#6366f1'}
                                    fillOpacity={0.8}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}
