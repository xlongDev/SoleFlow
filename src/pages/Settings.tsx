import { useRef, useState } from 'react'
import { useOrderStore } from '@/store/useOrderStore'
import { useThemeStore } from '@/store/useThemeStore'
import { GlassCard, Button } from '@/components/ui/LayoutPrimitives'
import { Label, Input } from '@/components/ui/FormPrimitives'
import { LanguageToggle } from '@/components/LanguageToggle'
import { Download, Upload, Trash2, Globe, Palette, Monitor, Moon, Sun, Save, Hexagon, Truck, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/store/useConfigStore'
import type { Order } from '@/types/order'
import { useTranslation } from 'react-i18next'
import { importFromExcel } from '@/lib/excelUtils'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PromptModal } from '@/components/ui/PromptModal'
import { toast } from 'sonner'

export function SettingsPage() {
    const { t, i18n } = useTranslation()
    const isChinese = i18n.language.startsWith('zh')
    const { orders, importOrders, clearOrders } = useOrderStore()
    const { theme, setTheme } = useThemeStore()
    const {
        logo, setLogo,
        primaryColor, setPrimaryColor,
        brandName, setBrandName,
        exportSettings, importSettings, resetToDefault,
        suppliers, setSuppliers
    } = useConfigStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const logoInputRef = useRef<HTMLInputElement>(null)
    const settingsInputRef = useRef<HTMLInputElement>(null)

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

    const handleExport = () => {
        const data = JSON.stringify(orders, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `orders-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            try {
                const newOrders = await importFromExcel(file)
                importOrders(newOrders)
                toast.success(isChinese ? `成功导入 ${newOrders.length} 条订单` : `Successfully imported ${newOrders.length} orders`)
            } catch (err) {
                toast.error(isChinese ? 'Excel导入失败，请检查文件格式' : 'Excel import failed, please check file format')
            }
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string) as Order[]
                if (Array.isArray(json)) {
                    importOrders(json)
                    toast.success(isChinese ? `成功导入 ${json.length} 条订单` : `Successfully imported ${json.length} orders`)
                } else {
                    toast.error('Invalid JSON format')
                }
            } catch (err) {
                toast.error('Failed to parse file')
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        }
        reader.readAsText(file)
    }

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

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
                    {t('settings.title')}
                </h1>
                <p className="text-slate-500 mt-2">{t('settings.subtitle')}</p>
            </div>

            <GlassCard className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Appearance */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Palette size={24} className="text-primary" />
                            {t('settings.theme')}
                        </h2>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-1">
                            {[
                                { id: 'light', icon: Sun, label: t('settings.themeLight') },
                                { id: 'dark', icon: Moon, label: t('settings.themeDark') },
                                { id: 'system', icon: Monitor, label: t('settings.themeSystem') }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setTheme(opt.id as any)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all outline-none",
                                        theme === opt.id
                                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    <opt.icon size={16} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Globe size={24} className="text-primary" />
                            {t('settings.language')}
                        </h2>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {t('settings.language')}
                            </span>
                            <LanguageToggle />
                        </div>
                    </div>

                    {/* Suppliers */}
                    <div className="md:col-span-2 space-y-6 pt-10 border-t border-slate-200 dark:border-white/10">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Truck size={24} className="text-primary" />
                                {isChinese ? '供应商管理' : 'Supplier Management'}
                            </h2>
                            <Button size="sm" onClick={handleAddSupplier} className="rounded-xl">
                                <Plus size={16} className="mr-1" /> {isChinese ? '添加供应商' : 'Add Supplier'}
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {suppliers.map(s => (
                                <div key={s} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 group">
                                    <span className="text-sm font-bold truncate pr-2">{s}</span>
                                    <button
                                        onClick={() => handleRemoveSupplier(s)}
                                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Branding Section */}
                <div className="pt-10 border-t border-slate-200 dark:border-white/10 space-y-8">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Save size={24} className="text-primary" />
                        {t('settings.branding')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Brand Name */}
                        <div className="space-y-4">
                            <Label className="text-slate-500 flex items-center gap-2">
                                {t('settings.brandName')}
                            </Label>
                            <Input
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                placeholder={t('settings.brandNamePlaceholder')}
                                className="h-12 px-4 rounded-xl border-slate-200 dark:border-white/10 focus:border-primary"
                            />
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-4">
                            <Label className="text-slate-500 flex items-center gap-2">
                                {t('settings.logo')}
                            </Label>
                            <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                                <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center relative group">
                                    {logo ? (
                                        <img src={logo} alt="Custom Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Hexagon className="text-slate-300" size={32} />
                                    )}
                                    <button
                                        onClick={() => setLogo(null)}
                                        className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500 mb-3">{t('settings.logoDesc')}</p>
                                    <Button size="sm" variant="secondary" onClick={() => logoInputRef.current?.click()}>
                                        <Upload size={14} className="mr-2" /> Upload
                                    </Button>
                                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </div>
                            </div>
                        </div>

                        {/* Theme Colors */}
                        <div className="space-y-4">
                            <Label className="text-slate-500">
                                {t('settings.themeColor')}
                            </Label>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                                <p className="text-xs text-slate-500 mb-4">{t('settings.themeColorDesc')}</p>
                                <div className="flex flex-wrap gap-3">
                                    {themeColors.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setPrimaryColor(color.value)}
                                            className={cn(
                                                "w-10 h-10 rounded-full border-4 transition-all duration-300 hover:scale-110 shadow-sm",
                                                primaryColor === color.value
                                                    ? "border-white dark:border-slate-400 scale-110 shadow-lg"
                                                    : "border-transparent"
                                            )}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-10 h-10 rounded-full bg-transparent border-0 cursor-pointer overflow-hidden"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="pt-10 border-t border-slate-200 dark:border-white/10">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Download size={24} className="text-primary" />
                        {t('settings.dataManagement')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
                            <h3 className="font-semibold mb-2">{t('settings.export')}</h3>
                            <p className="text-sm text-slate-500 mb-4">{t('settings.exportDesc')}</p>
                            <Button onClick={handleExport} className="gap-2">
                                <Download size={18} /> {t('settings.exportBtn')}
                            </Button>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
                            <h3 className="font-semibold mb-2">{isChinese ? '导出 Excel' : 'Export Excel'}</h3>
                            <p className="text-sm text-slate-500 mb-4">{isChinese ? '将订单导出为 Excel 表格，包含商品图片。' : 'Export orders to Excel including product images.'}</p>
                            <Button variant="outline" onClick={() => import('@/lib/excelUtils').then(m => m.exportToExcel(orders, i18n.language))} className="gap-2">
                                <Download size={18} /> {isChinese ? '导出 Excel' : 'Export Excel'}
                            </Button>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
                            <h3 className="font-semibold mb-2">{t('settings.import')}</h3>
                            <p className="text-sm text-slate-500 mb-4">{t('settings.importDesc')}</p>
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="gap-2">
                                <Upload size={18} /> {t('settings.importBtn')}
                            </Button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json, .xlsx, .xls" onChange={handleImport} />
                        </div>
                    </div>
                </div>

                {/* Settings Management */}
                <div className="pt-10 border-t border-slate-200 dark:border-white/10">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Save size={24} className="text-primary" />
                        {t('settings.settingsManagement')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
                            <h3 className="font-semibold mb-2">{t('settings.exportSettings')}</h3>
                            <p className="text-sm text-slate-500 mb-4">{t('settings.exportSettingsDesc')}</p>
                            <Button onClick={handleExportSettings} className="gap-2 w-full">
                                <Download size={18} /> {t('settings.exportSettings')}
                            </Button>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
                            <h3 className="font-semibold mb-2">{t('settings.importSettings')}</h3>
                            <p className="text-sm text-slate-500 mb-4">{t('settings.importSettingsDesc')}</p>
                            <Button variant="secondary" onClick={() => settingsInputRef.current?.click()} className="gap-2 w-full">
                                <Upload size={18} /> {t('settings.importSettings')}
                            </Button>
                            <input type="file" ref={settingsInputRef} className="hidden" accept=".json" onChange={handleImportSettings} />
                        </div>

                        <div className="p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
                            <h3 className="font-semibold mb-2">{t('settings.resetSettings')}</h3>
                            <p className="text-sm text-slate-500 mb-4">{t('settings.resetSettingsDesc')}</p>
                            <Button variant="outline" onClick={handleResetSettings} className="gap-2 w-full text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 border-orange-200">
                                <Trash2 size={18} /> {t('settings.resetSettings')}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-200 dark:border-white/10">
                    <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">{t('settings.dangerZone')}</h2>
                    <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-red-700 dark:text-red-300">{t('settings.clearAll')}</h3>
                                <p className="text-sm text-red-600/70 dark:text-red-400/70">{t('settings.clearAllDesc')}</p>
                            </div>
                            <Button variant="destructive" onClick={handleClearData} className="gap-2">
                                <Trash2 size={18} /> {t('settings.clearBtn')}
                            </Button>
                        </div>
                    </div>
                </div>
            </GlassCard >

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
        </div >
    )
}
