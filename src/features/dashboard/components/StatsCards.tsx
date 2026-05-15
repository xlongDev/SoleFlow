import { useFilteredOrders } from '@/hooks/useFilteredOrders'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { TrendingUp, Package, Banknote, RotateCcw } from 'lucide-react'
import { isSameDay, isSameMonth, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export function StatsCards() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const isChinese = i18n.language.startsWith('zh')
    const orders = useFilteredOrders()
    const today = new Date()

    const todayOrders = orders.filter(o => isSameDay(parseISO(o.createdAt), today))
    const monthOrders = orders.filter(o => isSameMonth(parseISO(o.createdAt), today))

    const todayRevenue = todayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)
    const monthRevenue = monthOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)

    const todayProfit = todayOrders.reduce((acc, o) => acc + (o.profit || 0), 0)
    const monthProfit = monthOrders.reduce((acc, o) => acc + (o.profit || 0), 0)

    const refundedItemsCount = orders.reduce((acc, o) => acc + o.items.filter(i => i.isRefunded).length, 0)
    const totalRefundAmount = orders.reduce((acc, o) => {
        return acc + o.items.filter(i => i.isRefunded).reduce((sum, i) => sum + (i.price * i.quantity), 0)
    }, 0)

    const stats = [
        {
            title: t('dashboard.todayRevenue'),
            value: `¥ ${todayRevenue.toLocaleString()}`,
            subLabel: t('dashboard.todayProfit'),
            subValue: `¥ ${todayProfit.toLocaleString()}`,
            icon: Banknote,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            title: t('dashboard.monthlyRevenue'),
            value: `¥ ${monthRevenue.toLocaleString()}`,
            subLabel: t('dashboard.monthlyProfit'),
            subValue: `¥ ${monthProfit.toLocaleString()}`,
            icon: TrendingUp,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: t('dashboard.totalOrders'),
            value: orders.length,
            subLabel: t('dashboard.totalProfit'),
            subValue: `¥ ${orders.reduce((acc, o) => acc + (o.profit || 0), 0).toLocaleString()}`,
            icon: Package,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
        {
            title: isChinese ? '总退款单数' : 'Refunded Items',
            value: refundedItemsCount,
            subLabel: isChinese ? '总退款金额' : 'Refund Amount',
            subValue: `¥ ${totalRefundAmount.toLocaleString()}`,
            icon: RotateCcw,
            color: "text-red-500",
            bg: "bg-red-500/10",
            onClick: () => navigate('/orders?filter=refunded')
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
                <GlassCard 
                    key={i} 
                    className={cn(
                        "p-6 flex items-center gap-4 group hover:scale-[1.02] transition-transform",
                        stat.onClick ? "cursor-pointer hover:shadow-lg hover:shadow-red-500/5 active:scale-95" : "cursor-default"
                    )}
                    onClick={stat.onClick}
                >
                    <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shrink-0 group-hover:scale-110 transition-transform`}>
                        <stat.icon size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{stat.value}</h3>
                        <div className="mt-2 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{stat.subLabel}</span>
                            <span className={`text-xs font-black ${stat.color}`}>{stat.subValue}</span>
                        </div>
                    </div>
                </GlassCard>
            ))}
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

