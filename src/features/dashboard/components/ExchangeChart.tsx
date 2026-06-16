import { useMemo, useState } from 'react'
import { useOrderStore } from '@/store/useOrderStore'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Cell, BarChart, Bar } from 'recharts'
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { zhCN, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { RefreshCw, PieChart as PieIcon, TrendingUp } from 'lucide-react'

export function ExchangeChart() {
    const { t, i18n } = useTranslation()
    const orders = useOrderStore(state => state.orders)
    const [range, setRange] = useState(30)
    const [view, setView] = useState<'trend' | 'reason'>('trend')
    const isChinese = i18n.language.startsWith('zh')
    const locale = isChinese ? zhCN : enUS

    const exchangeReasonLabels: Record<string, string> = isChinese ? {
        'size_issue': '尺码不合',
        'quality_issue': '质量问题',
        'customer_change': '客户改主意',
        'shipping_delay': '发货延迟',
        'other': '其他'
    } : {
        'size_issue': 'Size Issue',
        'quality_issue': 'Quality Issue',
        'customer_change': 'Customer Changed Mind',
        'shipping_delay': 'Shipping Delay',
        'other': 'Other'
    };

    const trendData = useMemo(() => {
        const end = new Date()
        const start = subDays(end, range - 1)
        const days = eachDayOfInterval({ start, end })

        return days.map(day => {
            const exchangedInDay = orders.filter(o => 
                isSameDay(parseISO(o.createdAt), day) && 
                o.items.some(item => item.isExchanged)
            ).length

            return {
                date: format(day, isChinese ? 'MM-dd' : 'MMM dd', { locale }),
                exchanges: exchangedInDay
            }
        })
    }, [orders, i18n.language, range])

    const reasonData = useMemo(() => {
        const reasons: Record<string, number> = {}
        orders.forEach(o => {
            o.items.forEach(item => {
                if (item.isExchanged) {
                    const reasonKey = item.exchangeReason || 'other'
                    reasons[reasonKey] = (reasons[reasonKey] || 0) + 1
                }
            })
        })

        const data = Object.entries(reasons).map(([key, value]) => ({
            name: exchangeReasonLabels[key] || t(`orders.exchangeReasons.${key}` as any) || key,
            value
        }))
        
        return data.sort((a, b) => b.value - a.value)
    }, [orders, t, isChinese])

    const COLORS = ['#3b82f6', '#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6']

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col relative overflow-hidden group">
            {/* Background Icon Watermark */}
            <div className="absolute -right-8 -bottom-8 text-slate-100 dark:text-white/[0.02] -rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
                <RefreshCw size={200} />
            </div>

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                        <RefreshCw size={18} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {isChinese ? '换货数据' : 'Exchange Data'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {view === 'trend' ? (isChinese ? '趋势图' : 'Trend Chart') : (isChinese ? '原因分布' : 'Reason Distribution')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                        <button
                            onClick={() => setView('trend')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                view === 'trend' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                            title={isChinese ? '趋势图' : 'Trend View'}
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
                            <PieIcon size={16} />
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
                                <linearGradient id="colorExchanges" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
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
                                allowDecimals={false}
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
                            />
                            <Area
                                type="monotone"
                                dataKey="exchanges"
                                stroke="#3b82f6"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorExchanges)"
                                animationDuration={1000}
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={reasonData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                                width={100}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                    backdropFilter: 'blur(10px)', 
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    color: '#000'
                                }}
                            />
                            <Bar 
                                dataKey="value" 
                                radius={[0, 8, 8, 0]} 
                                barSize={20}
                                animationDuration={1000}
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
