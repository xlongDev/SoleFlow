import { useMemo } from 'react'
import { useFilteredOrders } from '@/hooks/useFilteredOrders'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'

export function StatusPieChart() {
    const { t } = useTranslation()
    const orders = useFilteredOrders()

    const data = useMemo(() => {
        const pending = orders.filter(o => !o.shipping.trackingNumber && o.shipping.status === 'pending').length
        const shipped = orders.filter(o => (o.shipping.trackingNumber || o.shipping.status === 'shipped') && o.shipping.status !== 'delivered').length
        const delivered = orders.filter(o => o.shipping.status === 'delivered').length

        return [
            { name: t('status.pending'), value: pending, color: '#f59e0b' },
            { name: t('status.shipped'), value: shipped, color: '#6366f1' },
            { name: t('status.delivered'), value: delivered, color: '#10b981' }
        ].filter(d => d.value > 0)
    }, [orders, t])

    if (data.length === 0) {
        return (
            <GlassCard className="p-6 h-[400px] flex flex-col items-center justify-center text-slate-400">
                <p>{t('orders.noOrders')}</p>
            </GlassCard>
        )
    }

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">{t('charts.orderStatus', { defaultValue: 'Order Status' })}</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}
