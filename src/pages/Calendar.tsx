import { useState } from 'react'
import { useOrderStore } from '@/store/useOrderStore'
import { GlassCard } from '@/components/ui/LayoutPrimitives'
import { ChevronLeft, ChevronRight, Package, User, Phone, ArrowRight } from 'lucide-react'
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
    startOfWeek,
    endOfWeek
} from 'date-fns'
import { useTranslation } from 'react-i18next'
import { zhCN, enUS } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export function CalendarPage() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const orders = useOrderStore(state => state.orders)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const isChinese = i18n.language.startsWith('zh')
    const locale = isChinese ? zhCN : enUS

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
    const weekDays = isChinese
        ? ['日', '一', '二', '三', '四', '五', '六']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    const selectedDateOrders = selectedDate
        ? orders.filter(o => isSameDay(parseISO(o.createdAt), selectedDate))
        : []

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto pb-10 min-h-[600px]">
            <div className="flex-1 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
                            {t('calendar.title')}
                        </h1>
                        <p className="text-slate-500 mt-2">{t('calendar.subtitle')}</p>
                    </div>
                </div>

                <GlassCard className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {format(currentDate, isChinese ? 'yyyy年 MMMM' : 'MMMM yyyy', { locale })}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 mb-4">
                        {weekDays.map(day => (
                            <div key={day} className="text-center text-sm font-bold text-slate-400 uppercase tracking-wider py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day) => {
                            const dayOrders = orders.filter(o => isSameDay(parseISO(o.createdAt), day))
                            const isCurrentMonth = isSameMonth(day, monthStart)
                            const isToday = isSameDay(day, new Date())
                            const isSelected = selectedDate && isSameDay(day, selectedDate)

                            return (
                                <motion.div
                                    key={day.toISOString()}
                                    layout
                                    onClick={() => setSelectedDate(isSelected ? null : day)}
                                    className={`
                                min-h-[120px] rounded-2xl p-3 border transition-all cursor-pointer
                                ${isCurrentMonth ? 'bg-white/40 dark:bg-slate-800/40 border-slate-100 dark:border-white/5 shadow-sm' : 'bg-transparent border-transparent opacity-30'}
                                ${isToday ? 'ring-2 ring-primary bg-primary/5' : ''}
                                ${isSelected ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg scale-[1.02]' : 'hover:border-slate-300 dark:hover:border-white/20'}
                            `}
                                >
                                    <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {format(day, 'd')}
                                    </div>

                                    <div className="space-y-1">
                                        {dayOrders.slice(0, 3).map(order => (
                                            <div key={order.id} className="text-[10px] bg-white dark:bg-slate-700 p-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 truncate flex items-center gap-1">
                                                <Package size={10} className="text-purple-500" />
                                                <span className="truncate">{order.customer.name}</span>
                                            </div>
                                        ))}
                                        {dayOrders.length > 3 && (
                                            <div className="text-[10px] text-slate-400 pl-1 font-medium">
                                                {t('calendar.more', { count: dayOrders.length - 3 })}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </GlassCard>
            </div>

            {/* Side Panel for Selected Date Orders */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 'auto' }}
                        exit={{ opacity: 0, x: 20, width: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        className="w-full lg:w-96 shrink-0 overflow-hidden"
                    >
                        <GlassCard className="p-6 h-full border-primary/20 sticky top-8 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                                    <span className="w-2 h-6 bg-primary rounded-full" />
                                    {format(selectedDate, isChinese ? 'MM月dd日 订单' : 'Orders for MMM d', { locale })}
                                </h3>
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                            <div className="space-y-4 flex-1 overflow-y-auto px-2 pb-2 pt-1 -mx-2 scrollbar-hide">
                                {selectedDateOrders.length > 0 ? (
                                    selectedDateOrders.map(order => (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => navigate(`/orders/${order.id}/edit`)}
                                            className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/20 dark:border-white/5 space-y-3 hover:border-primary/40 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-sm truncate pr-2 group-hover:text-primary transition-colors">{order.items[0]?.name}</p>
                                                <p className="text-primary font-black text-xs shrink-0">¥{order.totalAmount.toLocaleString()}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                <div className="space-y-1">
                                                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{t('newOrder.recipientName')}</p>
                                                    <p className="flex items-center gap-1 font-medium"><User size={10} className="text-primary" /> {order.customer.name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{t('newOrder.phone')}</p>
                                                    <p className="flex items-center gap-1 font-mono"><Phone size={10} className="text-primary" /> {order.customer.phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-100 dark:border-white/5">
                                                <p className="font-mono opacity-60 truncate max-w-[150px]">{order.shipping.trackingNumber || 'No tracking'}</p>
                                                <ArrowRight size={12} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 text-slate-400">
                                        <Package size={48} className="mx-auto mb-4 opacity-10" />
                                        <p className="text-sm font-medium">{t('orders.noOrders')}</p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
