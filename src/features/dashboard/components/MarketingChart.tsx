import { useMemo } from 'react'
import { useFilteredOrders } from '@/hooks/useFilteredOrders'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { isSameDay, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'

export function MarketingChart() {
    const { t, i18n } = useTranslation()
    const orders = useFilteredOrders()

    const data = useMemo(() => {
        const today = new Date()

        // Analyze last 24 hours in 3-hour blocks
        const blocks = [0, 3, 6, 9, 12, 15, 18, 21].map(hour => {
            const start = new Date(today)
            start.setHours(hour, 0, 0, 0)
            const end = new Date(today)
            end.setHours(hour + 3, 0, 0, 0)

            const blockOrders = orders.filter(o => {
                const date = parseISO(o.createdAt)
                return isSameDay(date, today) && date >= start && date < end
            })

            const revenue = blockOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)

            return {
                time: `${hour}:00`,
                revenue: revenue,
                orders: blockOrders.length
            }
        })

        return blocks
    }, [orders, i18n.language])

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                {t('charts.marketingAnalysis')}
            </h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="time"
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
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(8px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                color: '#1e293b'
                            }}
                            itemStyle={{ color: '#10b981' }}
                        />
                        <Bar
                            dataKey="revenue"
                            fill="#10b981"
                            radius={[6, 6, 0, 0]}
                            barSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}
