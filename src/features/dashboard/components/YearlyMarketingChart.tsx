import { useMemo } from 'react'
import { useFilteredOrders } from '@/hooks/useFilteredOrders'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'

export function YearlyMarketingChart() {
    const { t } = useTranslation()
    const orders = useFilteredOrders()

    const data = useMemo(() => {
        const year = new Date().getFullYear()
        const monthMap = new Map<number, { revenue: number; orders: number }>()
        for (let m = 0; m < 12; m++) {
            monthMap.set(m, { revenue: 0, orders: 0 })
        }

        orders.forEach(order => {
            const date = parseISO(order.createdAt)
            if (date.getFullYear() !== year) return
            const month = date.getMonth()
            const current = monthMap.get(month)!
            current.revenue += order.totalAmount || 0
            current.orders += 1
        })

        return Array.from(monthMap.entries()).map(([month, value]) => ({
            month: format(new Date(year, month, 1), 'MM'),
            revenue: value.revenue,
            orders: value.orders
        }))
    }, [orders])

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                {t('charts.yearlyMarketingAnalysis')}
            </h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `¥${value}`} />
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
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}
