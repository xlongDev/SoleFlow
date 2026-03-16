import { useMemo } from 'react'
import { useFilteredOrders } from '@/hooks/useFilteredOrders'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts'
import { useTranslation } from 'react-i18next'

export function SizeAnalysisChart() {
    const { t } = useTranslation()
    const orders = useFilteredOrders()

    const data = useMemo(() => {
        const counts: Record<string, number> = {}
        orders.forEach(o => {
            o.items.forEach(item => {
                const size = item.size || 'N/A'
                counts[size] = (counts[size] || 0) + (item.quantity || 1)
            })
        })
        return Object.entries(counts)
            .map(([size, count]) => ({ size, count }))
            .sort((a, b) => parseFloat(a.size) - parseFloat(b.size))
    }, [orders])

    const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#0ea5e9']

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-primary rounded-full" />
                {t('dashboard.sizeAnalysis')}
            </h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="size"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            label={{ value: 'Size', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
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
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={25}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}
