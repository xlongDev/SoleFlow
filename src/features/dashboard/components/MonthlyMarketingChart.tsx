import { useMemo } from 'react'
import { useFilteredOrders } from '@/hooks/useFilteredOrders'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'

export function MonthlyMarketingChart() {
    const { t } = useTranslation()
    const orders = useFilteredOrders()

    const data = useMemo(() => {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()
        const dayMap = new Map<number, { revenue: number; orders: number }>()
        const maxDay = new Date(currentYear, currentMonth + 1, 0).getDate()

        for (let day = 1; day <= maxDay; day++) {
            dayMap.set(day, { revenue: 0, orders: 0 })
        }

        orders.forEach(order => {
            const date = parseISO(order.createdAt)
            if (date.getFullYear() !== currentYear || date.getMonth() !== currentMonth) return
            const day = date.getDate()
            const current = dayMap.get(day)!
            current.revenue += order.totalAmount || 0
            current.orders += 1
        })

        return Array.from(dayMap.entries()).map(([day, value]) => ({
            day: String(day).padStart(2, '0'),
            revenue: value.revenue,
            orders: value.orders
        }))
    }, [orders])

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-violet-500 rounded-full" />
                {t('charts.monthlyMarketingAnalysis')}
            </h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="monthlyRevenueFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `¥${value}`} />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(8px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                color: '#1e293b'
                            }}
                            formatter={(value) => [`¥${Number(value || 0).toLocaleString()}`, t('dashboard.totalRevenue')]}
                            labelFormatter={(label) => `${t('calendar.title')} ${label}`}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fill="url(#monthlyRevenueFill)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}
