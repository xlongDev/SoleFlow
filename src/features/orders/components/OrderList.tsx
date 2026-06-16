import { useState, useMemo } from 'react'
import { useOrderStore } from '@/store/useOrderStore'
import { GlassCard, Button } from '@/components/ui/LayoutPrimitives'
import { Input, Select } from '@/components/ui/FormPrimitives'
import { Search, Package, ExternalLink, User, Image as ImageIcon, Edit2, LayoutGrid, List, Download, Upload as UploadIcon, Trash2, TrendingUp, Phone, Copy, RotateCcw, RefreshCw } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { COURIER_OPTIONS, SIZE_MAPPING } from '@/types/order'
import type { Order } from '@/types/order'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { OrderPosterModal } from './OrderPosterModal'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { DataManagementModal } from '@/components/DataManagementModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low' | 'customer'

const OrderImageStack = ({ items }: { items: any[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const hasMultiple = items.length > 1;

    const handleNext = (e: React.MouseEvent) => {
        if (hasMultiple) {
            e.stopPropagation();
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }
    };

    if (!items || items.length === 0) return <Package size={48} className="text-slate-300" />;

    return (
        <div 
            className="relative w-full h-full flex items-center justify-center cursor-pointer group/stack"
            onClick={handleNext}
        >
            <AnimatePresence mode="wait">
                <div className="relative w-full h-full">
                    <motion.img
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        src={items[currentIndex].image}
                        alt={items[currentIndex].name}
                        className={cn(
                            "w-full h-full object-contain drop-shadow-xl", 
                            items[currentIndex].isRefunded && "grayscale opacity-60",
                            items[currentIndex].isExchanged && "opacity-85"
                        )}
                    />
                    {items[currentIndex].isRefunded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-red-500/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider transform -rotate-12 shadow-lg">
                                Refunded
                            </span>
                        </div>
                    )}
                    {items[currentIndex].isExchanged && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-blue-500/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider transform -rotate-12 shadow-lg">
                                Exchanged
                            </span>
                        </div>
                    )}
                </div>
            </AnimatePresence>

            {hasMultiple && (
                <>
                    {/* Shadow stacks effect */}
                    <div className="absolute inset-0 -z-10 translate-x-1 translate-y-1 opacity-20 scale-95 blur-[1px]">
                        <img src={items[(currentIndex + 1) % items.length].image} className="w-full h-full object-contain" alt="" />
                    </div>
                    
                    {/* Counter */}
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-white font-black z-20 flex items-center gap-1">
                        <span>{currentIndex + 1}</span>
                        <span className="opacity-40">/</span>
                        <span className="opacity-60">{items.length}</span>
                    </div>
                </>
            )}
        </div>
    );
};

export function OrderList() {
    const { t, i18n } = useTranslation()
    const isChinese = i18n.language.startsWith('zh')
    const locale = isChinese ? zhCN : enUS
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { orders, deleteOrder, deleteOrders, categoryFilter, setCategoryFilter } = useOrderStore()
    const [search, setSearch] = useState('')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [layout, setLayout] = useState<'grid' | 'list'>(() => {
        return (localStorage.getItem('order-layout') as 'grid' | 'list') || 'grid'
    })

    const handleLayoutChange = (newLayout: 'grid' | 'list') => {
        setLayout(newLayout)
        localStorage.setItem('order-layout', newLayout)
    }
    const [sortBy, setSortBy] = useState<SortOption>('newest')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', description: '', onConfirm: () => { } })
    // Refs removed as they are now in DataManagementModal
    const [isDataModalOpen, setIsDataModalOpen] = useState(false)
    const [dataModalMode, setDataModalMode] = useState<'all' | 'selected'>('all')

    // Derive filter state from URL search params (reactive to navigation)
    const showRefundedOnly = searchParams.get('filter') === 'refunded'
    const showExchangedOnly = searchParams.get('filter') === 'exchanged'

    const setShowRefundedOnly = (val: boolean) => {
        if (val) {
            setSearchParams({ filter: 'refunded' })
        } else {
            setSearchParams({})
        }
    }

    const setShowExchangedOnly = (val: boolean) => {
        if (val) {
            setSearchParams({ filter: 'exchanged' })
        } else {
            setSearchParams({})
        }
    }

    const handleCopyOrderInfo = (order: Order) => {
        const itemsStr = order.items.map(item => `${item.name} ${item.size}码`).join('\n')
        const textToCopy = `${itemsStr}\n${order.customer.name}\n${order.customer.phone}\n${order.customer.address}`
        navigator.clipboard.writeText(textToCopy)
            .then(() => toast.success(isChinese ? '复制成功' : 'Copied to clipboard'))
            .catch(() => toast.error(isChinese ? '复制失败' : 'Failed to copy'))
    }

    // handleImportExcel removed (integrated into DataManagementModal)
    // handleImportJson removed (integrated into DataManagementModal)

    const filteredAndSortedOrders = useMemo(() => {
        let result = orders.filter(order =>
            order.customer.name.toLowerCase().includes(search.toLowerCase()) ||
            order.customer.phone.includes(search) ||
            order.shipping.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
            order.items.some(item => item.name.toLowerCase().includes(search.toLowerCase()))
        )

        if (categoryFilter !== 'all') {
            result = result.filter(order =>
                order.items.some(item => (item.category || 'shoes') === categoryFilter)
            )
        }

        if (showRefundedOnly) {
            result = result.filter(order =>
                order.items.some(item => item.isRefunded)
            )
        }

        if (showExchangedOnly) {
            result = result.filter(order =>
                order.items.some(item => item.isExchanged)
            )
        }

        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                break
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                break
            case 'price-high':
                result.sort((a, b) => b.totalAmount - a.totalAmount)
                break
            case 'price-low':
                result.sort((a, b) => a.totalAmount - b.totalAmount)
                break
            case 'customer':
                result.sort((a, b) => a.customer.name.localeCompare(b.customer.name))
                break
        }

        return result
    }, [orders, search, sortBy, categoryFilter, showRefundedOnly, showExchangedOnly])

    const getCourierLabel = (val: string) => COURIER_OPTIONS.find(c => c.value === val)?.label || val

    const getTrackingLink = (order: Order) => {
        const courier = COURIER_OPTIONS.find(c => c.value === order.shipping.company);
        if (courier && courier.urlQuery && order.shipping.trackingNumber) {
            const url = courier.urlQuery + order.shipping.trackingNumber;
            // Ensure URL is absolute to prevent GH Pages 404
            return url.startsWith('http') ? url : `https://${url}`;
        }
        return undefined;
    }

    const getAftersalesTrackingLink = (company?: string, tracking?: string) => {
        if (!company || !tracking) return undefined;
        const courier = COURIER_OPTIONS.find(c => c.value === company);
        if (courier && courier.urlQuery) {
            const url = courier.urlQuery + tracking;
            return url.startsWith('http') ? url : `https://${url}`;
        }
        return undefined;
    }

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) newSelected.delete(id)
        else newSelected.add(id)
        setSelectedIds(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredAndSortedOrders.length && filteredAndSortedOrders.length > 0) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredAndSortedOrders.map(o => o.id)))
        }
    }

    // handleExport removed (integrated into DataManagementModal)
    // handleJsonExport removed (integrated into DataManagementModal)

    const handleBatchExport = () => {
        setDataModalMode('selected')
        setIsDataModalOpen(true)
    }

    const handleBatchDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: isChinese ? '确定要删除吗？' : 'Are you sure?',
            description: isChinese ? `确定要删除这 ${selectedIds.size} 条订单吗？此操作不可撤销。` : `Are you sure you want to delete ${selectedIds.size} orders? This action cannot be undone.`,
            onConfirm: () => {
                deleteOrders(Array.from(selectedIds))
                setSelectedIds(new Set())
            }
        })
    }

    if (orders.length === 0) {
        return (
            <>
                <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                    <Package size={64} className="mb-4 opacity-20" />
                    <h3 className="text-xl font-medium text-slate-500">{t('orders.noOrders')}</h3>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                        <Link to="/orders/new">
                            <Button className="h-11 px-6">{t('orders.createFirst')}</Button>
                        </Link>
                        <Button variant="outline" className="gap-2 h-11 px-6 bg-white/50 dark:bg-slate-900/50" onClick={() => { setDataModalMode('all'); setIsDataModalOpen(true); }}>
                            <UploadIcon size={18} />
                            {isChinese ? '管理数据' : 'Manage Data'}
                        </Button>
                    </div>
                </div>
                <DataManagementModal
                    isOpen={isDataModalOpen}
                    onClose={() => setIsDataModalOpen(false)}
                    mode={dataModalMode}
                    selectedIds={selectedIds}
                />
            </>
        )
    }

    return (
        <div className="space-y-6">
            <div className="relative z-[100] flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white/50 dark:bg-slate-900/50 p-4 rounded-3xl border border-white/20 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder={t('orders.searchPlaceholder')}
                            className="pl-10 h-11"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value as any)}
                            className="h-11 min-w-[120px]"
                        >
                            <option value="all">{isChinese ? '全部类别' : 'All Categories'}</option>
                            <option value="shoes">{isChinese ? '鞋子' : 'Shoes'}</option>
                            <option value="clothes">{isChinese ? '衣服' : 'Clothes'}</option>
                            <option value="pants">{isChinese ? '裤子' : 'Pants'}</option>
                        </Select>

                        <Select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as SortOption)}
                            className="h-11 min-w-[160px]"
                        >
                            <option value="newest">{isChinese ? '最新创建' : 'Newest'}</option>
                            <option value="oldest">{isChinese ? '最早创建' : 'Oldest'}</option>
                            <option value="price-high">{isChinese ? '金额最高' : 'Price: High to Low'}</option>
                            <option value="price-low">{isChinese ? '金额最低' : 'Price: Low to High'}</option>
                            <option value="customer">{isChinese ? '按收件人' : 'Customer Name'}</option>
                        </Select>

                        <button
                            onClick={() => setShowRefundedOnly(!showRefundedOnly)}
                            className={cn(
                                "h-11 px-4 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border shrink-0",
                                showRefundedOnly 
                                    ? "bg-red-500/10 border-red-500/20 text-red-500" 
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            )}
                        >
                            <RotateCcw size={16} className={cn(showRefundedOnly && "animate-spin-slow")} />
                            {isChinese ? '退款订单' : 'Refunds'}
                        </button>

                        <button
                            onClick={() => setShowExchangedOnly(!showExchangedOnly)}
                            className={cn(
                                "h-11 px-4 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border shrink-0",
                                showExchangedOnly 
                                    ? "bg-blue-500/10 border-blue-500/20 text-blue-500" 
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            )}
                        >
                            <RefreshCw size={16} className={cn(showExchangedOnly && "animate-spin-slow")} />
                            {isChinese ? '换货订单' : 'Exchanges'}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={toggleSelectAll}
                        className={cn(
                            "px-4 h-11 border rounded-xl text-sm font-medium transition-all",
                            selectedIds.size > 0 && selectedIds.size === filteredAndSortedOrders.length
                                ? "bg-primary text-white border-primary"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500"
                        )}
                    >
                        {isChinese ? (selectedIds.size === filteredAndSortedOrders.length ? '取消全选' : '全选') : (selectedIds.size === filteredAndSortedOrders.length ? 'Deselect All' : 'Select All')}
                    </button>

                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                        <button
                            onClick={() => handleLayoutChange('grid')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                layout === 'grid' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => handleLayoutChange('list')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                layout === 'list' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setDataModalMode('all'); setIsDataModalOpen(true); }} className="h-10 gap-2 px-4 rounded-xl border-slate-200 dark:border-white/10 hover:bg-primary/5 hover:text-primary transition-all">
                            <Download size={16} />
                            <span className="hidden sm:inline">{isChinese ? '管理数据' : 'Manage Data'}</span>
                        </Button>
                    </div>
                </div>
            </div>

            <motion.div
                layout
                className={cn(
                    layout === 'grid'
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "flex flex-col gap-4"
                )}
            >
                <AnimatePresence mode="popLayout">
                    {filteredAndSortedOrders.map(order => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                            transition={{ duration: 0.2 }}
                        >
                            {layout === 'grid' ? (
                                <GlassCard
                                    className={cn(
                                        "group overflow-hidden transition-all duration-300 flex flex-col cursor-pointer h-full relative",
                                        selectedIds.has(order.id)
                                            ? "ring-2 ring-primary border-primary shadow-2xl shadow-primary/40 bg-primary/[0.03] dark:bg-primary/[0.08]"
                                            : "border border-white/40 dark:border-white/10 hover:shadow-2xl hover:shadow-primary/10"
                                    )}
                                    onClick={() => toggleSelect(order.id)}
                                >
                                    <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800/50 relative overflow-hidden flex items-center justify-center p-4">
                                        <OrderImageStack items={order.items} />
                                        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end pointer-events-none">
                                            <span className={cn(
                                                "px-3 py-1 backdrop-blur-md text-white text-xs rounded-full font-bold shadow-lg border",
                                                order.items[0]?.isExchanged 
                                                    ? "bg-blue-500/80 border-blue-400/20" 
                                                    : "bg-black/60 border-white/20"
                                            )}>
                                                {(() => {
                                                    const effectiveSize = order.items[0]?.isExchanged 
                                                        ? (order.items[0]?.exchangeSize || order.items[0]?.size) 
                                                        : order.items[0]?.size;
                                                    const sizeInfo = SIZE_MAPPING.find(s => s.eur === effectiveSize);
                                                    const sizeStr = isChinese ? `${effectiveSize} 码` : `US ${sizeInfo?.us || effectiveSize}`;
                                                    return order.items[0]?.isExchanged ? `${sizeStr} (${isChinese ? '已换' : 'Ex'})` : sizeStr;
                                                })()}
                                            </span>
                                            {order.items.some(item => item.isRefunded) && (
                                                <span className={cn(
                                                    "px-3 py-1 backdrop-blur-md text-white text-[10px] rounded-full font-bold shadow-lg border border-white/20",
                                                    order.items.every(item => item.isRefunded) ? "bg-red-500/80" : "bg-orange-500/80"
                                                )}>
                                                    {order.items.every(item => item.isRefunded) ? (isChinese ? '全部退款' : 'Refunded') : (isChinese ? '部分退款' : 'Partial Refund')}
                                                </span>
                                            )}
                                            {order.items.some(item => item.isExchanged) && (
                                                <span className={cn(
                                                    "px-3 py-1 backdrop-blur-md text-white text-[10px] rounded-full font-bold shadow-lg border border-blue-400/20",
                                                    order.items.every(item => item.isExchanged) ? "bg-blue-500/80" : "bg-cyan-500/80"
                                                )}>
                                                    {order.items.every(item => item.isExchanged) ? (isChinese ? '全部换货' : 'Exchanged') : (isChinese ? '部分换货' : 'Partial Exchange')}
                                                </span>
                                            )}
                                            {order.items.length > 1 && (
                                                <span className="px-2 py-0.5 bg-primary/80 backdrop-blur-md text-white text-[10px] rounded-md font-bold shadow-lg">
                                                    +{order.items.length - 1} {isChinese ? '更多' : 'more'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4 flex-1 flex flex-col" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg leading-tight truncate">{order.items[0]?.name || 'Unknown Item'}</h3>
                                                <p className="text-slate-500 text-sm mt-1.5 flex items-center gap-3">
                                                    <span className="flex items-center gap-1.5">
                                                        <User size={14} className="text-primary" />
                                                        <span className="font-medium">{order.customer.name}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1 opacity-60 font-mono text-[11px]">
                                                        <Phone size={10} className="text-slate-400" />
                                                        {order.customer.phone}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-primary font-black text-lg">¥{order.totalAmount.toLocaleString()}</p>
                                                <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-500 mt-0.5">
                                                    <TrendingUp size={10} />
                                                    <span>¥{(order.profit || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-slate-200/50 dark:border-white/5 flex flex-col gap-2">
                                            <div className="flex justify-between items-center text-xs text-slate-500">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{getCourierLabel(order.shipping.company)}</p>
                                                    {order.shipping.trackingNumber ? (
                                                        <a
                                                            href={getTrackingLink(order)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="font-mono opacity-80 hover:text-primary hover:underline flex items-center gap-1"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            {order.shipping.trackingNumber}
                                                            <ExternalLink size={10} />
                                                        </a>
                                                    ) : <span className="opacity-50">No Tracking</span>}
                                                    {order.items.map((item, idx) => {
                                                         if (item.aftersalesTrackingNumber) {
                                                             const aftersalesLink = getAftersalesTrackingLink(item.aftersalesCourierCompany, item.aftersalesTrackingNumber);
                                                             const badgeText = item.isRefunded 
                                                                 ? (isChinese ? '退货' : 'Ret') 
                                                                 : (isChinese ? '换货' : 'Ex');
                                                             const badgeColor = item.isRefunded 
                                                                 ? 'text-red-500 bg-red-500/10 border-red-500/20' 
                                                                 : 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                                                             return (
                                                                 <div key={idx} className="mt-1.5 flex items-center gap-1 flex-wrap text-[10px]">
                                                                     <span className={cn("px-1 py-0.5 rounded border text-[9px] font-black scale-90 origin-left uppercase shrink-0", badgeColor)}>
                                                                         {badgeText}
                                                                     </span>
                                                                     <span className="opacity-60 shrink-0 font-medium truncate max-w-[70px]">
                                                                         {getCourierLabel(item.aftersalesCourierCompany || '')}:
                                                                     </span>
                                                                     {aftersalesLink ? (
                                                                         <a
                                                                             href={aftersalesLink}
                                                                             target="_blank"
                                                                             rel="noreferrer"
                                                                             className="font-mono font-bold text-slate-600 dark:text-slate-400 hover:text-primary hover:underline flex items-center gap-0.5"
                                                                             onClick={e => e.stopPropagation()}
                                                                         >
                                                                             {item.aftersalesTrackingNumber}
                                                                             <ExternalLink size={8} />
                                                                         </a>
                                                                     ) : (
                                                                         <span className="font-mono text-slate-500">{item.aftersalesTrackingNumber}</span>
                                                                     )}
                                                                 </div>
                                                             );
                                                         }
                                                         return null;
                                                     })}
                                                </div>
                                                <div className="text-right shrink-0 font-medium">
                                                    {format(new Date(order.createdAt), isChinese ? 'MM-dd HH:mm' : 'MMM d, HH:mm', { locale })}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <Button size="sm" variant="secondary" className="flex-1 min-w-[20%] h-9 text-xs gap-1 border border-slate-200 dark:border-white/10" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                                                    <ImageIcon size={14} /> {t('orders.poster')}
                                                </Button>
                                                <Button size="sm" variant="outline" className="flex-1 min-w-[20%] h-9 px-3 gap-1 hover:bg-primary/10 hover:text-primary transition-colors border-slate-200 dark:border-white/10" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}/edit`); }}>
                                                    <Edit2 size={14} /> {t('orders.edit')}
                                                </Button>
                                                <Button size="sm" variant="secondary" className="flex-1 min-w-[20%] h-9 text-xs gap-1 border border-slate-200 dark:border-white/10" onClick={(e) => { e.stopPropagation(); handleCopyOrderInfo(order); }}>
                                                    <Copy size={14} /> {isChinese ? '复制' : 'Copy'}
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-9 px-3 text-red-500 hover:bg-red-500/10 border-red-500/20" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmModal({
                                                        isOpen: true,
                                                        title: isChinese ? '删除订单' : 'Delete Order',
                                                        description: isChinese ? '确定要删除这条订单吗？此操作不可撤销。' : 'Are you sure you want to delete this order? This action cannot be undone.',
                                                        onConfirm: () => deleteOrder(order.id)
                                                    })
                                                }}>
                                                    <Trash2 size={14} />
                                                </Button>
                                                {!order.shipping.trackingNumber && (
                                                    <Button
                                                        size="sm"
                                                        className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md shadow-blue-600/20"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/orders/${order.id}/edit?focusTracking=true`);
                                                        }}
                                                    >
                                                        {isChinese ? '发货' : 'Ship'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            ) : (
                                <GlassCard
                                    className={cn(
                                        "flex flex-col sm:flex-row items-stretch sm:items-center p-4 gap-4 sm:gap-6 transition-all group relative cursor-pointer",
                                        selectedIds.has(order.id)
                                            ? "ring-2 ring-primary border-primary shadow-xl shadow-primary/40 bg-primary/[0.05] dark:bg-primary/[0.12]"
                                            : "border border-slate-200 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/5"
                                    )}
                                    onClick={() => toggleSelect(order.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-full sm:w-20 h-40 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 relative">
                                            <OrderImageStack items={order.items} />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="md:col-span-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate">{order.items[0]?.name}</h3>
                                            <p className="text-[11px] text-slate-500 flex flex-col gap-1 mt-1.5">
                                                <span className="flex items-center gap-1.5 min-h-[16px]"><User size={12} className="text-primary" /> {order.customer.name}</span>
                                                <span className="flex items-center gap-1.5 min-h-[16px] font-mono opacity-70"><Phone size={10} className="text-slate-400" /> {order.customer.phone}</span>
                                            </p>
                                        </div>
                                        <div className="hidden md:block">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('orders.size')}</p>
                                            <p className="text-sm font-medium mt-1">
                                                {(() => {
                                                    const effectiveSize = order.items[0]?.isExchanged 
                                                        ? (order.items[0]?.exchangeSize || order.items[0]?.size) 
                                                        : order.items[0]?.size;
                                                    const sizeInfo = SIZE_MAPPING.find(s => s.eur === effectiveSize);
                                                    const sizeStr = isChinese ? `${effectiveSize} 码` : `US ${sizeInfo?.us || effectiveSize}`;
                                                    return order.items[0]?.isExchanged ? `${sizeStr} (${isChinese ? '已换' : 'Ex'})` : sizeStr;
                                                })()}
                                                {order.items.length > 1 && <span className="ml-2 text-xs text-primary">+{order.items.length - 1} items</span>}
                                            </p>
                                        </div>
                                        <div className="hidden md:block">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{getCourierLabel(order.shipping.company)}</p>
                                            {order.shipping.trackingNumber ? (
                                                <a
                                                    href={getTrackingLink(order)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm font-mono mt-1 opacity-70 truncate flex items-center gap-1 hover:text-primary hover:underline"
                                                >
                                                    {order.shipping.trackingNumber}
                                                    <ExternalLink size={12} />
                                                </a>
                                            ) : <p className="text-sm opacity-30 mt-1">---</p>}
                                            {order.items.map((item, idx) => {
                                                if (item.aftersalesTrackingNumber) {
                                                    const aftersalesLink = getAftersalesTrackingLink(item.aftersalesCourierCompany, item.aftersalesTrackingNumber);
                                                    const badgeText = item.isRefunded 
                                                        ? (isChinese ? '退货' : 'Ret') 
                                                        : (isChinese ? '换货' : 'Ex');
                                                    const badgeColor = item.isRefunded 
                                                        ? 'text-red-500 bg-red-500/10 border-red-500/20' 
                                                        : 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                                                    return (
                                                        <div key={idx} className="mt-1 flex items-center gap-1 text-[10px]" onClick={e => e.stopPropagation()}>
                                                            <span className={cn("px-1 py-0.2 rounded border text-[9px] font-bold uppercase shrink-0 scale-90 origin-left", badgeColor)}>
                                                                {badgeText}
                                                            </span>
                                                            <span className="opacity-60 shrink-0 font-medium truncate max-w-[70px]">
                                                                {getCourierLabel(item.aftersalesCourierCompany || '')}:
                                                            </span>
                                                            {aftersalesLink ? (
                                                                <a
                                                                    href={aftersalesLink}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="font-mono font-bold text-slate-600 dark:text-slate-400 hover:text-primary hover:underline flex items-center gap-0.5"
                                                                >
                                                                    {item.aftersalesTrackingNumber}
                                                                    <ExternalLink size={8} />
                                                                </a>
                                                            ) : (
                                                                <span className="font-mono text-slate-500">{item.aftersalesTrackingNumber}</span>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isChinese ? '实付金额' : 'Total'}</p>
                                            <p className="text-sm font-black text-primary mt-1">
                                                ¥{order.totalAmount.toLocaleString()}
                                                {(order.items.some(item => item.isRefunded) || order.items.some(item => item.isExchanged)) && <span className="ml-1 text-[10px] text-orange-500">(Net)</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isChinese ? '利润' : 'Profit'}</p>
                                            <p className="text-sm font-black text-emerald-500 mt-1 flex items-center gap-1">
                                                <TrendingUp size={12} />
                                                ¥{(order.profit || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-end items-center gap-2 lg:min-w-[280px]" onClick={(e) => e.stopPropagation()}>
                                        {!order.shipping.trackingNumber && (
                                            <Button
                                                size="sm"
                                                className="h-9 px-4 shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-500/20"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(`/orders/${order.id}/edit?focusTracking=true`)
                                                }}
                                            >
                                                {isChinese ? '发货' : 'Ship'}
                                            </Button>
                                        )}
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" className="h-9 px-4 gap-2 shrink-0 border border-slate-200 dark:border-white/10" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                                                <ImageIcon size={16} />
                                                <span className="hidden lg:inline">{t('orders.poster')}</span>
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-9 px-4 gap-2 shrink-0 border border-slate-200 dark:border-white/10" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}/edit`); }}>
                                                <Edit2 size={16} />
                                                <span className="hidden lg:inline">{t('orders.edit')}</span>
                                            </Button>
                                            <Button size="sm" variant="secondary" className="h-9 px-3 gap-2 shrink-0 border border-slate-200 dark:border-white/10" onClick={(e) => { e.stopPropagation(); handleCopyOrderInfo(order); }}>
                                                <Copy size={16} />
                                                <span className="hidden lg:inline">{isChinese ? '复制' : 'Copy'}</span>
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-9 px-3 text-red-500 hover:bg-red-500/10 border-red-500/20 shrink-0" onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmModal({
                                                    isOpen: true,
                                                    title: isChinese ? '删除订单' : 'Delete Order',
                                                    description: isChinese ? '确定要删除这条订单吗？此操作不可撤销。' : 'Are you sure you want to delete this order? This action cannot be undone.',
                                                    onConfirm: () => deleteOrder(order.id)
                                                })
                                            }}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                </GlassCard>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            <OrderPosterModal
                order={selectedOrder}
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                description={confirmModal.description}
            />

            <DataManagementModal
                isOpen={isDataModalOpen}
                onClose={() => setIsDataModalOpen(false)}
                mode={dataModalMode}
                selectedIds={selectedIds}
            />

            {/* Batch Action Bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100, x: '-50%', opacity: 0 }}
                        animate={{ y: 0, x: '-50%', opacity: 1 }}
                        exit={{ y: 100, x: '-50%', opacity: 0 }}
                        className="fixed bottom-8 left-1/2 z-50"
                    >
                        <GlassCard className="flex items-center gap-6 p-4 px-6 border-primary/20 shadow-2xl shadow-primary/20 backdrop-blur-xl">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-primary">{selectedIds.size} {isChinese ? '个已选择' : 'Selected'}</span>
                            </div>
                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                            <div className="flex gap-3">
                                <Button size="sm" onClick={handleBatchExport} className="gap-2 px-4 rounded-xl hover:scale-105 active:scale-95 transition-transform">
                                    <Download size={16} /> {isChinese ? '导出已选' : 'Export'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleBatchDelete} className="gap-2 px-4 rounded-xl text-red-500 hover:bg-red-500/10 border-red-500/20 hover:scale-105 active:scale-95 transition-transform">
                                    <Trash2 size={16} /> {isChinese ? '删除已选' : 'Delete'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="px-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                                    {isChinese ? '取消' : 'Cancel'}
                                </Button>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    )
}
