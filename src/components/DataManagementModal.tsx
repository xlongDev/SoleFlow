import { useState, useRef } from 'react'
import { useOrderStore } from '@/store/useOrderStore'
import { Button } from '@/components/ui/LayoutPrimitives'
import { Modal } from '@/components/ui/Modal'
import { Download, Upload as UploadIcon, FileJson, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { exportToExcel, importFromExcel } from '@/lib/excelUtils'
import { exportToJson, importFromJson } from '@/lib/jsonUtils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface DataManagementModalProps {
    isOpen: boolean
    onClose: () => void
    mode?: 'all' | 'selected'
    selectedIds?: Set<string>
}

export function DataManagementModal({ isOpen, onClose, mode = 'all', selectedIds }: DataManagementModalProps) {
    const { t, i18n } = useTranslation()
    const isChinese = i18n.language.startsWith('zh')
    const { orders, importOrders, clearOrders } = useOrderStore()
    const [excludeRefunded, setExcludeRefunded] = useState(false)
    const [exportRangeType, setExportRangeType] = useState<'all' | 'day' | 'month' | 'selected'>('all')
    const [importRangeType, setImportRangeType] = useState<'all' | 'day' | 'month'>('all')
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedMonth, setSelectedMonth] = useState('')
    const [confirmClearOpen, setConfirmClearOpen] = useState(false)
    const importInputRef = useRef<HTMLInputElement>(null)
    const jsonImportInputRef = useRef<HTMLInputElement>(null)

    const filterOrdersByRange = (rawOrders: typeof orders, rangeType: 'all' | 'day' | 'month' | 'selected') => {
        if (rangeType === 'selected' && selectedIds) {
            return rawOrders.filter(o => selectedIds.has(o.id))
        }
        if (rangeType === 'day' && selectedDate) {
            const day = new Date(`${selectedDate}T00:00:00`)
            return rawOrders.filter(o => {
                const created = new Date(o.createdAt)
                if (Number.isNaN(created.getTime())) return false
                return isWithinInterval(created, { start: startOfDay(day), end: endOfDay(day) })
            })
        }
        if (rangeType === 'month' && selectedMonth) {
            const monthDate = new Date(`${selectedMonth}-01T00:00:00`)
            return rawOrders.filter(o => {
                const created = new Date(o.createdAt)
                if (Number.isNaN(created.getTime())) return false
                return isWithinInterval(created, { start: startOfMonth(monthDate), end: endOfMonth(monthDate) })
            })
        }
        return rawOrders
    }

    const executeExport = async (formatType: 'excel' | 'json') => {
        let dataToExport = mode === 'selected' && selectedIds ? orders.filter(o => selectedIds.has(o.id)) : orders
        const effectiveRange = mode === 'selected' ? 'selected' : exportRangeType
        dataToExport = filterOrdersByRange(dataToExport, effectiveRange)

        if (effectiveRange === 'day' && !selectedDate) return toast.error(isChinese ? '请先选择日期' : 'Please select a date first')
        if (effectiveRange === 'month' && !selectedMonth) return toast.error(isChinese ? '请先选择月份' : 'Please select a month first')

        const getTag = () => {
            if (effectiveRange === 'selected') return isChinese ? '已选' : 'Selected'
            if (effectiveRange === 'day') return selectedDate || (isChinese ? '指定日期' : 'date')
            if (effectiveRange === 'month') return selectedMonth || (isChinese ? '指定月份' : 'month')
            return isChinese ? '全部' : 'All'
        }

        const tag = getTag()

        if (formatType === 'excel') {
            const promise = exportToExcel(dataToExport, i18n.language, tag, { 
                excludeRefunded, 
                hideRefundHeader: false
            })
            toast.promise(promise, {
                loading: isChinese ? '正在导出 Excel...' : 'Exporting Excel...',
                success: isChinese ? '导出成功' : 'Export successful',
                error: isChinese ? '导出失败' : 'Export failed'
            })
        } else {
            const promise = exportToJson(dataToExport, i18n.language, tag)
            toast.promise(promise, {
                loading: isChinese ? '正在导出 JSON...' : 'Exporting JSON...',
                success: isChinese ? '导出成功' : 'Export successful',
                error: isChinese ? '导出失败' : 'Export failed'
            })
        }
        onClose()
    }

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (importRangeType === 'day' && !selectedDate) return toast.error(isChinese ? '请先选择日期' : 'Please select a date first')
            if (importRangeType === 'month' && !selectedMonth) return toast.error(isChinese ? '请先选择月份' : 'Please select a month first')
            try {
                const newOrders = await importFromExcel(file)
                const filteredOrders = filterOrdersByRange(newOrders, importRangeType)
                importOrders(filteredOrders)
                toast.success(isChinese ? `成功导入 ${filteredOrders.length} 条订单` : `Successfully imported ${filteredOrders.length} orders`)
                onClose()
            } catch (err) {
                console.error('Excel import failed:', err)
                toast.error(isChinese ? '导入失败，请检查文件格式' : 'Import failed, please check file format')
            } finally {
                if (importInputRef.current) importInputRef.current.value = ''
            }
        }
    }

    const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (importRangeType === 'day' && !selectedDate) return toast.error(isChinese ? '请先选择日期' : 'Please select a date first')
            if (importRangeType === 'month' && !selectedMonth) return toast.error(isChinese ? '请先选择月份' : 'Please select a month first')
            try {
                const newOrders = await importFromJson(file)
                const filteredOrders = filterOrdersByRange(newOrders, importRangeType)
                importOrders(filteredOrders)
                toast.success(isChinese ? `成功导入 ${filteredOrders.length} 条订单` : `Successfully imported ${filteredOrders.length} orders`)
                onClose()
            } catch (err) {
                console.error('JSON import failed:', err)
                toast.error(isChinese ? '导入失败，请检查文件格式' : 'Import failed, please check file format')
            } finally {
                if (jsonImportInputRef.current) jsonImportInputRef.current.value = ''
            }
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isChinese ? '数据导入与导出' : 'Data Import & Export'}
        >
            <div className="space-y-8">
                {/* Export Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Download size={14} />
                        {isChinese ? '导出数据' : 'Export Data'}
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-wrap gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div 
                                    onClick={() => setExcludeRefunded(!excludeRefunded)}
                                    className={cn(
                                        "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                                        excludeRefunded ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-700 group-hover:border-primary/50"
                                    )}
                                >
                                    {excludeRefunded && <Check size={12} className="text-white" />}
                                </div>
                                <span className={cn("text-xs font-medium transition-colors", excludeRefunded ? "text-primary" : "text-slate-500")}>
                                    {t('settings.excludeRefunded')}
                                </span>
                            </label>


                        </div>

                        {mode !== 'selected' && (
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'day', 'month'] as const).map(type => (
                                    <Button
                                        key={type}
                                        variant={exportRangeType === type ? 'primary' : 'outline'}
                                        size="sm"
                                        className="h-9 text-xs rounded-xl"
                                        onClick={() => setExportRangeType(type)}
                                    >
                                        {isChinese ? (type === 'all' ? '全部' : type === 'day' ? '指定日期' : '指定月份') : (type === 'all' ? 'All' : type === 'day' ? 'Date' : 'Month')}
                                    </Button>
                                ))}
                            </div>
                        )}

                        {(mode === 'selected' || exportRangeType === 'day') && (
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 px-3 text-sm"
                            />
                        )}
                        {(mode !== 'selected' && exportRangeType === 'month') && (
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 px-3 text-sm"
                            />
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 text-xs font-bold rounded-xl border-slate-200 dark:border-white/10 hover:bg-primary/5 hover:text-primary transition-all"
                                onClick={() => executeExport('excel')}
                            >
                                Excel
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 text-xs font-bold rounded-xl border-slate-200 dark:border-white/10 hover:bg-primary/5 hover:text-primary transition-all"
                                onClick={() => executeExport('json')}
                            >
                                JSON
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Import Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <UploadIcon size={14} />
                        {isChinese ? '导入数据' : 'Import Data'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {(['all', 'day', 'month'] as const).map(type => (
                            <Button
                                key={type}
                                variant={importRangeType === type ? 'primary' : 'outline'}
                                size="sm"
                                className="h-9 text-xs rounded-xl"
                                onClick={() => setImportRangeType(type)}
                            >
                                {isChinese ? (type === 'all' ? '导入全部' : type === 'day' ? '仅指定日期' : '仅指定月份') : (type === 'all' ? 'Import All' : type === 'day' ? 'Only Date' : 'Only Month')}
                            </Button>
                        ))}
                    </div>
                    {importRangeType === 'day' && (
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 px-3 text-sm"
                        />
                    )}
                    {importRangeType === 'month' && (
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 px-3 text-sm"
                        />
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Button 
                            variant="secondary" 
                            className="h-12 gap-2 rounded-xl"
                            onClick={() => importInputRef.current?.click()}
                        >
                            <Download size={18} className="rotate-180" />
                            {isChinese ? '导入 Excel' : 'Import Excel'}
                        </Button>
                        <Button 
                            variant="secondary" 
                            className="h-12 gap-2 rounded-xl"
                            onClick={() => jsonImportInputRef.current?.click()}
                        >
                            <FileJson size={18} />
                            {isChinese ? '导入 JSON' : 'Import JSON'}
                        </Button>
                        <input type="file" ref={importInputRef} accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
                        <input type="file" ref={jsonImportInputRef} accept=".json" className="hidden" onChange={handleImportJson} />
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                        {isChinese ? '导入数据将与现有数据合并，不会删除现有订单。' : 'Imported data will be merged with existing data.'}
                    </p>
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/10">
                    <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest">
                        {isChinese ? '危险操作' : 'Danger Zone'}
                    </h3>
                    <Button
                        variant="destructive"
                        className="w-full h-11 rounded-xl"
                        onClick={() => setConfirmClearOpen(true)}
                    >
                        {isChinese ? '清空所有订单' : 'Clear All Orders'}
                    </Button>
                </div>
            </div>
            <ConfirmModal
                isOpen={confirmClearOpen}
                onClose={() => setConfirmClearOpen(false)}
                onConfirm={() => {
                    clearOrders()
                    setConfirmClearOpen(false)
                    onClose()
                    toast.success(isChinese ? '已清空所有订单' : 'All orders cleared')
                }}
                title={isChinese ? '确认清空所有订单' : 'Confirm Clear All Orders'}
                description={isChinese ? '该操作不可恢复，是否继续？' : 'This action cannot be undone. Continue?'}
                variant="destructive"
            />
        </Modal>
    )
}
