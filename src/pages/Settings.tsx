import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrderStore } from '@/store/useOrderStore'
import { useThemeStore } from '@/store/useThemeStore'
import { GlassCard, Button } from '@/components/ui/LayoutPrimitives'
import { Label, Input } from '@/components/ui/FormPrimitives'
import { Download, Upload, Trash2, Globe, Palette, Monitor, Moon, Sun, Save, Truck, Plus, Image as ImageIcon, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/store/useConfigStore'
import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PromptModal } from '@/components/ui/PromptModal'
import { toast } from 'sonner'
import { DataManagementModal } from '@/components/DataManagementModal'
import { SiteMark } from '@/components/SiteMark'

export function SettingsPage() {
    const { t, i18n } = useTranslation()
    const isChinese = i18n.language.startsWith('zh')
    const { clearOrders } = useOrderStore()
    const { theme, setTheme } = useThemeStore()
    const {
        logo, setLogo,
        primaryColor, setPrimaryColor,
        brandName, setBrandName,
        exportSettings, importSettings, resetToDefault,
        suppliers, setSuppliers,
        supplierAftercare, updateSupplierAftercare,
        imageCompressionEnabled, setImageCompressionEnabled,
        imageCompressionQuality, setImageCompressionQuality,
        posterCompressionEnabled, setPosterCompressionEnabled,
        posterCompressionQuality, setPosterCompressionQuality,
        maxImageWidth, setMaxImageWidth
    } = useConfigStore()
    const [isDataModalOpen, setIsDataModalOpen] = useState(false)
    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set())

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', description: '', onConfirm: () => { } })

    const [promptModal, setPromptModal] = useState<{
        isOpen: boolean;
        title: string;
        placeholder: string;
        initialValue: string;
        onConfirm: (val: string) => void;
    }>({ isOpen: false, title: '', placeholder: '', initialValue: '', onConfirm: () => { } })

    const themeColors = [
        { name: 'Indigo', value: '#6366f1' },
        { name: 'Emerald', value: '#10b981' },
        { name: 'Rose', value: '#f43f5e' },
        { name: 'Amber', value: '#f59e0b' },
        { name: 'Violet', value: '#8b5cf6' },
        { name: 'Sky', value: '#0ea5e9' },
        { name: 'Pink', value: '#ec4899' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Teal', value: '#14b8a6' },
        { name: 'Cyan', value: '#06b6d4' },
        { name: 'Lime', value: '#84cc16' },
        { name: 'Slate', value: '#64748b' },
    ]

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (event) => {
            setLogo(event.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    const logoInputRef = useRef<HTMLInputElement>(null)
    const settingsInputRef = useRef<HTMLInputElement>(null)

    const handleClearData = () => {
        setConfirmModal({
            isOpen: true,
            title: isChinese ? '清除所有数据' : 'Clear All Data',
            description: t('settings.clearDataConfirm') || (isChinese ? '确定要清除所有数据吗？此操作不可撤销。' : 'Are you sure you want to clear all data? This cannot be undone.'),
            onConfirm: () => {
                clearOrders()
                toast.success(isChinese ? '数据已清除' : 'Data cleared')
            }
        })
    }

    const handleExportSettings = () => {
        const settingsJson = exportSettings();
        const blob = new Blob([settingsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `soleflow-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const jsonString = event.target?.result as string;
            const success = importSettings(jsonString);
            if (success) {
                toast.success(t('settings.importSuccess') || 'Settings imported successfully!');
            } else {
                toast.error(t('settings.importError') || 'Failed to import settings. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };

    const handleResetSettings = () => {
        setConfirmModal({
            isOpen: true,
            title: isChinese ? '重置所有设置' : 'Reset All Settings',
            description: t('settings.resetConfirm') || (isChinese ? '确定要重置所有设置吗？' : 'Are you sure you want to reset all settings to default?'),
            onConfirm: () => {
                resetToDefault()
                toast.success(isChinese ? '设置已重置' : 'Settings reset')
            }
        })
    };
    const handleAddSupplier = () => {
        setPromptModal({
            isOpen: true,
            title: isChinese ? '添加供应商' : 'Add Supplier',
            placeholder: isChinese ? '输入新供应商名称' : 'Enter new supplier name',
            initialValue: '',
            onConfirm: (name: string) => {
                if (name && !suppliers.includes(name)) {
                    setSuppliers([...suppliers, name])
                    toast.success(isChinese ? `供应商 ${name} 已添加` : `Supplier ${name} added`)
                }
            }
        })
    }

    const handleRemoveSupplier = (name: string) => {
        if (suppliers.length <= 1) {
            toast.error(isChinese ? '至少保留一个供应商' : 'Keep at least one supplier')
            return
        }
        setConfirmModal({
            isOpen: true,
            title: isChinese ? '删除供应商' : 'Remove Supplier',
            description: isChinese ? `确定删除供应商 ${name} 吗？` : `Are you sure you want to remove supplier ${name}?`,
            onConfirm: () => {
                setSuppliers(suppliers.filter(s => s !== name))
                toast.success(isChinese ? `供应商 ${name} 已删除` : `Supplier ${name} removed`)
            }
        })
    }

    const toggleSupplier = (name: string) => {
        const next = new Set(expandedSuppliers)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        setExpandedSuppliers(next)
    }

    const handleCopyAftercare = (s: string) => {
        const care = supplierAftercare[s]
        if (!care) return
        const parts = [
            `${isChinese ? '供应商' : 'Supplier'}: ${s}`,
            `${isChinese ? '退货地址' : 'Address'}: ${care.refundAddress.trim()}`,
            `${isChinese ? '联系方式' : 'Contact'}: ${care.refundContact.trim()}`
        ]
        if (care.refundNotes?.trim()) {
            parts.push(`${isChinese ? '备注' : 'Notes'}: ${care.refundNotes.trim()}`)
        }
        const text = parts.filter(p => !p.endsWith(': ') && !p.endsWith(':')).join('\n')
        navigator.clipboard.writeText(text)
        toast.success(isChinese ? '售后信息已复制' : 'After-sales info copied')
    }

    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <header className="space-y-2">
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-primary to-slate-600 dark:from-white dark:via-primary dark:to-slate-400 tracking-tight">
                    {t('settings.title')}
                </h1>
                <p className="text-slate-500 text-lg">{t('settings.subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 gap-10">
                {/* Appearance & Language */}
                <GlassCard className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Palette size={20} />
                                </div>
                                {t('settings.theme')}
                            </h2>
                            <div className="grid grid-cols-3 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl gap-1 relative overflow-hidden">
                                {[
                                    { id: 'light', icon: Sun, label: t('settings.themeLight') },
                                    { id: 'dark', icon: Moon, label: t('settings.themeDark') },
                                    { id: 'system', icon: Monitor, label: t('settings.themeSystem') }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setTheme(opt.id as any)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-bold transition-all duration-300 outline-none relative z-10",
                                            theme === opt.id
                                                ? "text-primary"
                                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        )}
                                    >
                                        {theme === opt.id && (
                                            <motion.div
                                                layoutId="settings-theme-active"
                                                className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-xl z-[-1]"
                                                transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                                            />
                                        )}
                                        <opt.icon size={20} className={cn("transition-transform duration-300", theme === opt.id && "scale-110")} />
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Globe size={20} />
                                </div>
                                {t('settings.language')}
                            </h2>
                            <div className="flex flex-col h-[76px]">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 h-full relative overflow-hidden">
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 relative z-10">
                                        {isChinese ? '界面语言' : 'Display Language'}
                                    </span>
                                    <div className="flex bg-white/50 dark:bg-white/5 p-1 rounded-xl relative z-10">
                                        {[
                                            { id: 'zh', label: '中文' },
                                            { id: 'en', label: 'EN' }
                                        ].map((lang) => {
                                            const isActive = i18n.language.startsWith(lang.id);
                                            return (
                                                <button
                                                    key={lang.id}
                                                    onClick={() => i18n.changeLanguage(lang.id)}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 relative",
                                                        isActive ? "text-primary" : "text-slate-400 hover:text-slate-600"
                                                    )}
                                                >
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="settings-lang-active"
                                                            className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-lg z-[-1]"
                                                            transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                                                        />
                                                    )}
                                                    {lang.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Suppliers */}
                <GlassCard className="p-10 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                    <Truck size={24} />
                                </div>
                                {isChinese ? '供应商与售后服务' : 'Suppliers & After-sales'}
                            </h2>
                            <p className="text-base text-slate-500">
                                {isChinese ? '统一管理供应商联系方式与退货地址，提升售后处理效率。' : 'Efficiently manage supplier contacts and return addresses.'}
                            </p>
                        </div>
                        <Button size="md" onClick={handleAddSupplier} className="rounded-2xl shrink-0 px-8">
                            <Plus size={20} className="mr-2" /> {isChinese ? '添加新供应商' : 'Add Supplier'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {suppliers.map((s) => {
                            const care = supplierAftercare[s] || { refundAddress: '', refundContact: '', refundNotes: '' }
                            const isExpanded = expandedSuppliers.has(s)
                            return (
                                <div key={s} className="rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 overflow-hidden hover:shadow-lg transition-all duration-500 group">
                                    <div className="p-6 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-4 cursor-pointer select-none" onClick={() => toggleSupplier(s)}>
                                            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 group-hover:text-primary transition-colors">
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isChinese ? '供应商' : 'Supplier'}</p>
                                                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 group-hover:text-primary transition-colors">{s}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleCopyAftercare(s)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                                title={isChinese ? '复制售后信息' : 'Copy After-sales'}
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSupplier(s)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                title={isChinese ? '删除' : 'Remove'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-6 pt-0 space-y-5 border-t border-slate-100 dark:border-white/5 mt-2 pt-6">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">{isChinese ? '退货 / 退款地址' : 'Refund / return address'}</Label>
                                                        <textarea
                                                            className="w-full min-h-[80px] rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                            value={care.refundAddress}
                                                            onChange={(e) => updateSupplierAftercare(s, { refundAddress: e.target.value })}
                                                            placeholder={isChinese ? '省市区街道门牌…' : 'Full return address…'}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">{isChinese ? '售后联系电话 / 微信' : 'After-sales phone / WeChat'}</Label>
                                                        <Input
                                                            value={care.refundContact}
                                                            onChange={(e) => updateSupplierAftercare(s, { refundContact: e.target.value })}
                                                            placeholder={isChinese ? '手机、固话或微信号' : 'Phone or WeChat'}
                                                            className="h-12 rounded-2xl border-slate-200 dark:border-white/10 px-4"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">{isChinese ? '备注（退货说明等）' : 'Notes'}</Label>
                                                        <textarea
                                                            className="w-full min-h-[60px] rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                            value={care.refundNotes}
                                                            onChange={(e) => updateSupplierAftercare(s, { refundNotes: e.target.value })}
                                                            placeholder={isChinese ? '收件人抬头、到付说明等' : 'Receiver name, freight collect, etc.'}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
                    </div>
                </GlassCard>

                {/* Branding & Image Settings */}
                <GlassCard className="p-10 space-y-12">
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
                                <Palette size={24} />
                            </div>
                            {t('settings.branding')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-3">
                                <Label className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                    {t('settings.brandName')}
                                </Label>
                                <Input
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    placeholder={t('settings.brandNamePlaceholder')}
                                    className="h-14 px-6 rounded-2xl border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-lg"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                    {t('settings.logo')}
                                </Label>
                                <div className="flex items-center gap-6 p-5 rounded-[2rem] bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 group/logo">
                                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center relative group shadow-sm transition-transform duration-500 hover:scale-105">
                                        {logo ? (
                                            <img src={logo} alt="Custom Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <SiteMark className="w-10 h-10 text-slate-300" />
                                        )}
                                        <button
                                            onClick={() => setLogo(null)}
                                            className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <Trash2 size={24} />
                                        </button>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{t('settings.logoDesc')}</p>
                                        <Button size="sm" variant="secondary" onClick={() => logoInputRef.current?.click()} className="rounded-xl">
                                            <Upload size={14} className="mr-2" /> {isChinese ? '更换图标' : 'Change Logo'}
                                        </Button>
                                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                {t('settings.themeColor')}
                            </Label>
                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-white/5">
                                <p className="text-xs text-slate-500 mb-6">{t('settings.themeColorDesc')}</p>
                                <div className="flex flex-wrap gap-3.5">
                                    {themeColors.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setPrimaryColor(color.value)}
                                            className={cn(
                                                "w-10 h-10 rounded-full border-4 transition-all duration-300 hover:scale-110 shadow-md",
                                                primaryColor === color.value
                                                    ? "border-white dark:border-slate-400 scale-110 shadow-xl"
                                                    : "border-transparent"
                                            )}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                    <div className="relative group/picker">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="w-10 h-10 rounded-full bg-transparent border-0 cursor-pointer overflow-hidden opacity-0 absolute inset-0 z-10"
                                        />
                                        <div className="w-10 h-10 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover/picker:text-primary group-hover/picker:border-primary transition-colors">
                                            <Plus size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-200 dark:border-white/10 space-y-8">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                <ImageIcon size={24} />
                            </div>
                            {t('settings.imageSettings')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Style Photo Compression */}
                            <div className="space-y-6 bg-slate-50 dark:bg-slate-800/20 p-6 rounded-[2rem] border border-slate-150 dark:border-white/5">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-bold text-slate-700 dark:text-slate-300">
                                            {t('settings.imageCompression')}
                                        </Label>
                                        <button
                                            onClick={() => setImageCompressionEnabled(!imageCompressionEnabled)}
                                            className={cn(
                                                "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none",
                                                imageCompressionEnabled ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md",
                                                    imageCompressionEnabled ? "translate-x-6" : "translate-x-1"
                                                )}
                                            />
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed">{t('settings.imageCompressionDesc')}</p>
                                </div>

                                {imageCompressionEnabled && (
                                    <div className="space-y-6 pt-4 border-t border-slate-200/50 dark:border-white/5">
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('settings.compressionQuality')}</Label>
                                                <span className="text-base font-black text-primary">{Math.round(imageCompressionQuality * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1.0"
                                                step="0.05"
                                                value={imageCompressionQuality}
                                                onChange={(e) => setImageCompressionQuality(parseFloat(e.target.value))}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider block">{t('settings.maxImageWidth')} (px)</Label>
                                            <Input
                                                type="number"
                                                value={maxImageWidth}
                                                onChange={(e) => setMaxImageWidth(parseInt(e.target.value) || 800)}
                                                className="h-12 px-4 rounded-xl border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Poster Compression */}
                            <div className="space-y-6 bg-slate-50 dark:bg-slate-800/20 p-6 rounded-[2rem] border border-slate-150 dark:border-white/5">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-bold text-slate-700 dark:text-slate-300">
                                            {t('settings.posterCompression')}
                                        </Label>
                                        <button
                                            onClick={() => setPosterCompressionEnabled(!posterCompressionEnabled)}
                                            className={cn(
                                                "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none",
                                                posterCompressionEnabled ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md",
                                                    posterCompressionEnabled ? "translate-x-6" : "translate-x-1"
                                                )}
                                            />
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed">{t('settings.posterCompressionDesc')}</p>
                                </div>

                                {posterCompressionEnabled && (
                                    <div className="space-y-3 pt-4 border-t border-slate-200/50 dark:border-white/5">
                                        <div className="flex justify-between">
                                            <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('settings.posterCompressionQuality')}</Label>
                                            <span className="text-base font-black text-primary">{Math.round(posterCompressionQuality * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1.0"
                                            step="0.05"
                                            value={posterCompressionQuality}
                                            onChange={(e) => setPosterCompressionQuality(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Data & Export/Import */}
                <GlassCard className="p-10 space-y-12">
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                <Download size={24} />
                            </div>
                            {t('settings.dataManagement')}
                        </h2>
                        
                        <div className="p-8 rounded-[2.5rem] bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center gap-10 group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                            <div className="p-8 rounded-3xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-700 shadow-inner">
                                <Download size={48} />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <h3 className="text-2xl font-black">{isChinese ? '订单数据中心' : 'Order Data Center'}</h3>
                                <p className="text-base text-slate-500 leading-relaxed max-w-xl">
                                    {isChinese 
                                        ? '深度管理订单数据的导入导出。支持 Excel/JSON 格式，提供灵活的时间范围筛选功能。' 
                                        : 'Advanced management for order data. Supports Excel/JSON formats with flexible date range filtering.'}
                                </p>
                            </div>
                            <Button 
                                onClick={() => setIsDataModalOpen(true)} 
                                className="h-16 px-10 gap-4 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1 active:scale-95"
                            >
                                <Download size={24} />
                                {isChinese ? '立即进入' : 'Open Center'}
                            </Button>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-200 dark:border-white/10 space-y-8">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Save size={20} />
                            </div>
                            {t('settings.settingsManagement')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    title: t('settings.exportSettings'),
                                    desc: t('settings.exportSettingsDesc'),
                                    icon: Download,
                                    action: handleExportSettings,
                                    variant: 'primary' as const
                                },
                                {
                                    title: t('settings.importSettings'),
                                    desc: t('settings.importSettingsDesc'),
                                    icon: Upload,
                                    action: () => settingsInputRef.current?.click(),
                                    variant: 'secondary' as const
                                },
                                {
                                    title: t('settings.resetSettings'),
                                    desc: t('settings.resetSettingsDesc'),
                                    icon: Trash2,
                                    action: handleResetSettings,
                                    variant: 'outline' as const,
                                    className: "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 border-orange-200"
                                }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 rounded-[2rem] bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 flex flex-col justify-between group hover:border-primary/20 transition-all">
                                    <div className="space-y-3">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                            <item.icon size={24} />
                                        </div>
                                        <h3 className="font-bold text-lg">{item.title}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed mb-6">{item.desc}</p>
                                    </div>
                                    <Button variant={item.variant} onClick={item.action} className={cn("gap-2 w-full h-12 rounded-xl font-bold", item.className)}>
                                        <item.icon size={18} /> {item.title}
                                    </Button>
                                    {item.title === t('settings.importSettings') && (
                                        <input type="file" ref={settingsInputRef} className="hidden" accept=".json" onChange={handleImportSettings} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-200 dark:border-white/10 space-y-6">
                        <h2 className="text-xl font-black text-red-600 dark:text-red-400 flex items-center gap-2">
                            <Trash2 size={24} />
                            {t('settings.dangerZone')}
                        </h2>
                        <div className="p-8 rounded-[2rem] bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Trash2 size={120} />
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                                <div className="space-y-2 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-red-700 dark:text-red-300">{t('settings.clearAll')}</h3>
                                    <p className="text-base text-red-600/70 dark:text-red-400/70 max-w-xl">{t('settings.clearAllDesc')}</p>
                                </div>
                                <Button variant="destructive" onClick={handleClearData} className="h-14 px-10 gap-3 text-lg font-bold rounded-2xl shadow-lg shadow-red-500/20">
                                    <Trash2 size={20} /> {t('settings.clearBtn')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                description={confirmModal.description}
            />

            <PromptModal
                isOpen={promptModal.isOpen}
                onClose={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={promptModal.onConfirm}
                title={promptModal.title}
                placeholder={promptModal.placeholder}
                initialValue={promptModal.initialValue}
            />
            
            <DataManagementModal
                isOpen={isDataModalOpen}
                onClose={() => setIsDataModalOpen(false)}
            />
        </div>
    )
}
