import { useMemo } from 'react'
import { useFilteredOrders } from '@/hooks/useFilteredOrders'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { useTranslation } from 'react-i18next'

export function RegionAnalysisChart() {
    const { t } = useTranslation()
    const orders = useFilteredOrders()

    const data = useMemo(() => {
        const counts: Record<string, number> = {}
        orders.forEach(o => {
            // Simple logic: first 2-3 characters of address or city extract
            // For Chinese, it's often the province/city
            const addr = o.customer.address || ''
            const region = addr.substring(0, 3) || 'Others'
            counts[region] = (counts[region] || 0) + 1
        })
        return Object.entries(counts)
            .map(([region, count]) => ({ region, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
    }, [orders])

    const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e']

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-primary rounded-full" />
                {t('dashboard.regionAnalysis')}
            </h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="region"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            width={80}
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
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
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
