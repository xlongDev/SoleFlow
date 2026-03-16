import { useMemo } from 'react'
import { useFilteredOrders } from '@/hooks/useFilteredOrders'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { format, subMonths, eachMonthOfInterval, isSameMonth, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { zhCN, enUS } from 'date-fns/locale'

export function YearlyRevenueChart() {
    const { t, i18n } = useTranslation()
    const orders = useFilteredOrders()

    const data = useMemo(() => {
        const end = new Date()
        const start = subMonths(end, 11)
        const months = eachMonthOfInterval({ start, end })
        const isChinese = i18n.language.startsWith('zh')
        const locale = isChinese ? zhCN : enUS

        return months.map(month => {
            const monthOrders = orders.filter(o => isSameMonth(parseISO(o.createdAt), month))
            const revenue = monthOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)
            return {
                month: format(month, isChinese ? 'MM月' : 'MMM', { locale }),
                revenue: revenue
            }
        })
    }, [orders, i18n.language])

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">{t('charts.revenueTrends')}</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenueYear" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickFormatter={(value) => `¥${value}`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenueYear)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}
