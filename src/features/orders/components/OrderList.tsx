import { useState, useMemo, useRef } from 'react'
import { useOrderStore } from '@/store/useOrderStore'
import { GlassCard, Button } from '@/components/ui/LayoutPrimitives'
import { Input, Select } from '@/components/ui/FormPrimitives'
import { Search, Package, ExternalLink, User, Image as ImageIcon, Edit2, LayoutGrid, List, Download, Upload as UploadIcon, Trash2, TrendingUp, FileJson, Phone, Copy } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { COURIER_OPTIONS, SIZE_MAPPING } from '@/types/order'
import type { Order } from '@/types/order'
import { format, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Modal } from '@/components/ui/Modal'
import { zhCN, enUS } from 'date-fns/locale'
import { OrderPosterModal } from './OrderPosterModal'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { exportToExcel, importFromExcel } from '@/lib/excelUtils'
import { exportToJson, importFromJson } from '@/lib/jsonUtils'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low' | 'customer'

export function OrderList() {
    const { t, i18n } = useTranslation()
    const isChinese = i18n.language.startsWith('zh')
    const locale = isChinese ? zhCN : enUS
    const navigate = useNavigate()
    const { orders, importOrders, deleteOrder, categoryFilter, setCategoryFilter } = useOrderStore()
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
    const importInputRef = useRef<HTMLInputElement>(null)
    const jsonImportInputRef = useRef<HTMLInputElement>(null)
    const [exportModal, setExportModal] = useState<{
        isOpen: boolean,
        exportType: 'all' | 'selected',
        format: 'excel' | 'json'
    }>({ isOpen: false, exportType: 'all', format: 'excel' })

    const handleCopyOrderInfo = (order: Order) => {
        const itemsStr = order.items.map(item => `${item.name} ${item.size}码`).join('\n')
        const textToCopy = `${itemsStr}\n${order.customer.name}\n${order.customer.phone}\n${order.customer.address}`
        navigator.clipboard.writeText(textToCopy)
            .then(() => toast.success(isChinese ? '复制成功' : 'Copied to clipboard'))
            .catch(() => toast.error(isChinese ? '复制失败' : 'Failed to copy'))
    }

    const executeExport = (range: 'all' | 'week' | 'month' | 'year') => {
        const now = new Date()
        let dataToExport = exportModal.exportType === 'selected' ? orders.filter(o => selectedIds.has(o.id)) : orders

        if (range === 'week') {
            dataToExport = dataToExport.filter(o => isWithinInterval(new Date(o.createdAt), { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }))
        } else if (range === 'month') {
            dataToExport = dataToExport.filter(o => isWithinInterval(new Date(o.createdAt), { start: startOfMonth(now), end: endOfMonth(now) }))
        } else if (range === 'year') {
            dataToExport = dataToExport.filter(o => isWithinInterval(new Date(o.createdAt), { start: startOfYear(now), end: endOfYear(now) }))
        }

        const getTag = () => {
            if (range === 'week') {
                return isChinese 
                    ? `本周(${format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')}至${format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')})`
                    : `Week_${format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyyMMdd')}-${format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyyMMdd')}`
            }
            if (range === 'month') {
                return isChinese 
                    ? `本月(${format(now, 'yyyy-MM')})`
                    : `Month_${format(now, 'yyyy-MM')}`
            }
            if (range === 'year') {
                return isChinese 
                    ? `本年(${format(now, 'yyyy')})`
                    : `Year_${format(now, 'yyyy')}`
            }
            if (range === 'all' && dataToExport.length > 0) {
                const dates = dataToExport.map(o => new Date(o.createdAt).getTime())
                const start = new Date(Math.min(...dates))
                const end = new Date(Math.max(...dates))
                return isChinese
                    ? `全部(${format(start, 'yyyyMMdd')}至${format(end, 'yyyyMMdd')})`
                    : `All_${format(start, 'yyyyMMdd')}-${format(end, 'yyyyMMdd')}`
            }
            return isChinese ? '全部' : 'All'
        }

        const tag = getTag()

        if (exportModal.format === 'excel') {
            handleExport(dataToExport, tag)
        } else {
            handleJsonExport(dataToExport, tag)
        }
        setExportModal(prev => ({ ...prev, isOpen: false }))
    }

    const filteredAndSortedOrders = useMemo(() => {
        let result = orders.filter(order =>
            order.customer.name.toLowerCase().includes(search.toLowerCase()) ||
            order.customer.phone.includes(search) ||
            order.shipping.trackingNumber.includes(search) ||
            order.items.some(item => item.name.toLowerCase().includes(search.toLowerCase()))
        )

        if (categoryFilter !== 'all') {
            result = result.filter(order =>
                order.items.some(item => (item.category || 'shoes') === categoryFilter)
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
    }, [orders, search, sortBy, categoryFilter])

    const getCourierLabel = (val: string) => COURIER_OPTIONS.find(c => c.value === val)?.label || val

    const getTrackingLink = (order: Order) => {
        const courier = COURIER_OPTIONS.find(c => c.value === order.shipping.company);
        if (courier && courier.urlQuery) {
            return courier.urlQuery + order.shipping.trackingNumber
        }
        return '#'
    }

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            try {
                const newOrders = await importFromExcel(file)
                importOrders(newOrders)
                toast.success(isChinese ? `成功导入 ${newOrders.length} 条订单` : `Successfully imported ${newOrders.length} orders`)
            } catch (err) {
                toast.error(isChinese ? '导入失败，请检查文件格式' : 'Import failed, please check file format')
            } finally {
                if (importInputRef.current) importInputRef.current.value = ''
            }
        }
    }

    const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            try {
                const newOrders = await importFromJson(file)
                importOrders(newOrders)
                toast.success(isChinese ? `成功导入 ${newOrders.length} 条订单` : `Successfully imported ${newOrders.length} orders`)
            } catch (err) {
                toast.error(isChinese ? '导入失败，请检查文件格式' : 'Import failed, please check file format')
            } finally {
                if (jsonImportInputRef.current) jsonImportInputRef.current.value = ''
            }
        }
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

    const handleExport = async (data: Order[], tag: string = '') => {
        const promise = exportToExcel(data, i18n.language, tag)
        toast.promise(promise, {
            loading: isChinese ? '正在导出 Excel...' : 'Exporting Excel...',
            success: isChinese ? '导出成功' : 'Export successful',
            error: isChinese ? '导出失败' : 'Export failed'
        })
    }

    const handleJsonExport = async (data: Order[], tag: string = '') => {
        const promise = exportToJson(data, i18n.language, tag)
        toast.promise(promise, {
            loading: isChinese ? '正在导出 JSON...' : 'Exporting JSON...',
            success: isChinese ? '导出成功' : 'Export successful',
            error: isChinese ? '导出失败' : 'Export failed'
        })
    }

    const handleBatchExport = () => {
        // Default to excel for batch, or we could add a format selector
        setExportModal({ isOpen: true, exportType: 'selected', format: 'excel' })
    }

    const handleBatchDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: isChinese ? '确定要删除吗？' : 'Are you sure?',
            description: isChinese ? `确定要删除这 ${selectedIds.size} 条订单吗？此操作不可撤销。` : `Are you sure you want to delete ${selectedIds.size} orders? This action cannot be undone.`,
            onConfirm: () => {
                selectedIds.forEach(id => deleteOrder(id))
                setSelectedIds(new Set())
            }
        })
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <Package size={64} className="mb-4 opacity-20" />
                <h3 className="text-xl font-medium text-slate-500">{t('orders.noOrders')}</h3>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                    <Link to="/orders/new">
                        <Button className="h-11 px-6">{t('orders.createFirst')}</Button>
                    </Link>
                    <Button variant="outline" className="gap-2 h-11 px-6 bg-white/50 dark:bg-slate-900/50" onClick={() => jsonImportInputRef.current?.click()}>
                        <FileJson size={18} />
                        {isChinese ? '导入 JSON' : 'Import JSON'}
                    </Button>
                    <Button variant="outline" className="gap-2 h-11 px-6 bg-white/50 dark:bg-slate-900/50" onClick={() => importInputRef.current?.click()}>
                        <UploadIcon size={18} />
                        {isChinese ? '导入 Excel' : 'Import Excel'}
                    </Button>
                    <input type="file" ref={jsonImportInputRef} accept=".json" className="hidden" onChange={handleImportJson} />
                    <input type="file" ref={importInputRef} accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
                </div>
            </div>
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
                        <Button variant="outline" size="sm" onClick={() => setExportModal({ isOpen: true, exportType: 'all', format: 'excel' })} className="h-10 gap-2 px-4 rounded-xl">
                            <Download size={16} />
                            <span className="hidden sm:inline">{isChinese ? '导出 Excel' : 'Export Excel'}</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setExportModal({ isOpen: true, exportType: 'all', format: 'json' })} className="h-10 gap-2 px-4 rounded-xl">
                            <FileJson size={16} />
                            <span className="hidden sm:inline">{isChinese ? '导出 JSON' : 'Export JSON'}</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-10 gap-2 px-4 rounded-xl" onClick={() => importInputRef.current?.click()}>
                            <UploadIcon size={16} />
                            <span className="hidden sm:inline">{isChinese ? '导入 Excel' : 'Import'}</span>
                        </Button>
                        <input type="file" ref={importInputRef} accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
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
                                        {order.items[0]?.image ? (
                                            <img
                                                src={order.items[0].image}
                                                alt={order.items[0].name}
                                                className="w-full h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <Package size={48} className="text-slate-300" />
                                        )}
                                        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                                            <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs rounded-full font-bold shadow-lg border border-white/20">
                                                {(() => {
                                                    const sizeInfo = SIZE_MAPPING.find(s => s.eur === order.items[0]?.size);
                                                    return isChinese ? `${order.items[0]?.size} 码` : `US ${sizeInfo?.us || order.items[0]?.size}`;
                                                })()}
                                            </span>
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
                                        <div className="w-full sm:w-20 h-40 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5">
                                            {order.items[0]?.image ? (
                                                <img src={order.items[0].image} alt={order.items[0].name} className="w-full h-full object-contain" />
                                            ) : <Package className="text-slate-300" />}
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
                                                    const sizeInfo = SIZE_MAPPING.find(s => s.eur === order.items[0]?.size);
                                                    return isChinese ? `${order.items[0]?.size} 码` : `US ${sizeInfo?.us || order.items[0]?.size}`;
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
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isChinese ? '实付金额' : 'Total'}</p>
                                            <p className="text-sm font-black text-primary mt-1">¥{order.totalAmount.toLocaleString()}</p>
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

            <Modal
                isOpen={exportModal.isOpen}
                onClose={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
                title={isChinese ? `导出 ${exportModal.format.toUpperCase()}` : `Export ${exportModal.format.toUpperCase()}`}
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-slate-500">
                        {isChinese ? '请选择需要导出的时间范围：' : 'Please select the date range to export:'}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-12 border-slate-200 dark:border-white/10 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => executeExport('week')}>
                            {isChinese ? '本周' : 'This Week'}
                        </Button>
                        <Button variant="outline" className="h-12 border-slate-200 dark:border-white/10 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => executeExport('month')}>
                            {isChinese ? '本月' : 'This Month'}
                        </Button>
                        <Button variant="outline" className="h-12 border-slate-200 dark:border-white/10 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => executeExport('year')}>
                            {isChinese ? '本年' : 'This Year'}
                        </Button>
                        <Button className="h-12 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" onClick={() => executeExport('all')}>
                            {isChinese ? '全部时间' : 'All Time'}
                        </Button>
                    </div>
                </div>
            </Modal>

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
