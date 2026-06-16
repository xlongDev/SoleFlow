import { useRef, useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { OrderPoster } from './OrderPoster'
import { Button } from '@/components/ui/LayoutPrimitives'
import { toPng } from 'html-to-image'
import type { Order } from '@/types/order'
import { Download, Loader2, Settings2, Palette, Monitor, Hexagon, LayoutGrid, List, Sparkles, Image as ImageIcon, Plus, Zap, Cpu, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Label, Select } from '@/components/ui/FormPrimitives'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/store/useConfigStore'

interface OrderPosterModalProps {
    order: Order | null
    isOpen: boolean
    onClose: () => void
}

export function OrderPosterModal({ order, isOpen, onClose }: OrderPosterModalProps) {
    const { t, i18n } = useTranslation()
    const globalConfig = useConfigStore()
    const isChinese = i18n.language.startsWith('zh')
    const posterRef = useRef<HTMLDivElement>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    const initialConfig = {
        showPrice: true,
        showAddress: true,
        showTracking: true,
        showShoeName: true,
        showOrderId: true,
        style: 'elegant' as const,
        shoeNameOverride: '',
        layoutMode: 'center' as const,
        imageScale: 1,
        fontSizeScale: 1,
        primaryColor: globalConfig.primaryColor || '#000000',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        posterSize: { width: 800, height: 1000, label: 'Default (4:5)' },
        brandPosition: 'top-left' as const,
        brandColor: '#000000',
        logoScale: 1,
        logoX: 0,
        logoY: 0,
        shoeRotation: 0,
        shoeX: 0,
        shoeY: 0
    }

    const [config, setConfig] = useState(initialConfig)

    const handleRestoreDefault = () => {
        setConfig(initialConfig)
        toast.info(isChinese ? '已恢复默认设置' : 'Restored to default settings')
    }

    const SIZE_PRESETS = [
        { label: isChinese ? '默认 (4:5)' : 'Default (4:5)', width: 800, height: 1000 },
        { label: isChinese ? '手机海报 (9:16)' : 'Story (9:16)', width: 1080, height: 1920 },
        { label: isChinese ? '正方形 (1:1)' : 'Square (1:1)', width: 1080, height: 1080 },
        { label: isChinese ? 'A4 纸张' : 'A4 (Paper)', width: 1240, height: 1754 },
    ]

    const STYLES = [
        { id: 'elegant', label: isChinese ? '优雅' : 'Elegant', icon: Sparkles },
        { id: 'glass', label: isChinese ? '玻璃' : 'Glass', icon: Sparkles },
        { id: 'aura', label: isChinese ? '灵动' : 'Aura', icon: Sparkles },
        { id: 'flash', label: isChinese ? '闪速' : 'Flash', icon: Zap },
        { id: 'blueprint', label: isChinese ? '蓝图' : 'Blueprint', icon: Cpu },
        { id: 'comic', label: isChinese ? '漫画' : 'Comic', icon: ImageIcon },
        { id: 'grid', label: isChinese ? '格栅' : 'Grid', icon: LayoutGrid },
        { id: 'vibrant', label: isChinese ? '活力炫彩' : 'Vibrant', icon: Sparkles },
        { id: 'polaroid', label: isChinese ? '拍立得' : 'Polaroid', icon: ImageIcon },
        { id: 'minimalDark', label: isChinese ? '极简深色' : 'Minimal Dark', icon: LayoutGrid },
        { id: 'classic', label: isChinese ? '经典' : t('settings.posterStyleClassic'), icon: Palette },
        { id: 'modern', label: isChinese ? '现代' : t('settings.posterStyleModern'), icon: Monitor },
        { id: 'cyber', label: isChinese ? '赛博' : t('settings.posterStyleCyber'), icon: Hexagon },
        { id: 'luxury', label: isChinese ? '奢华' : 'Luxury', icon: Palette },
        { id: 'minimalist', label: isChinese ? '极简' : 'Minimal', icon: LayoutGrid },
        { id: 'receipt', label: isChinese ? '小票' : 'Receipt', icon: List },
        { id: 'street', label: isChinese ? '街头' : 'Street', icon: Hexagon },
        { id: 'retro', label: isChinese ? '复古' : 'Retro', icon: Monitor },
        { id: 'business', label: isChinese ? '商务' : 'Business', icon: Palette },
        { id: 'sports', label: isChinese ? '运动' : 'Sports', icon: Hexagon },
        { id: 'art', label: isChinese ? '艺术' : 'Art', icon: LayoutGrid },
        { id: 'tech', label: isChinese ? '科技' : 'Tech', icon: Monitor },
        { id: 'magazine', label: isChinese ? '杂志' : 'Magazine', icon: Palette },
        { id: 'industrial', label: isChinese ? '工业' : 'Industrial', icon: Hexagon },
        { id: 'nature', label: isChinese ? '自然' : 'Nature', icon: LayoutGrid },
        { id: 'typography', label: isChinese ? '文字' : 'Typo', icon: Monitor },
        { id: 'gradient', label: isChinese ? '渐变' : 'Gradient', icon: Palette },
        { id: 'ink', label: isChinese ? '水墨' : 'Ink', icon: Palette },
        { id: 'neon', label: isChinese ? '霓虹' : 'Neon', icon: Monitor },
        { id: 'paper', label: isChinese ? '纸质' : 'Paper', icon: LayoutGrid },
    ]

    useEffect(() => {
        if (isOpen && order) {
            setConfig(prev => ({
                ...prev,
                shoeNameOverride: order.items[0]?.name || ''
            }))
        }
    }, [isOpen, order])

    if (!order) return null

    const handleDownload = async () => {
        if (!posterRef.current) return
        setIsGenerating(true)

        try {
            await new Promise(resolve => setTimeout(resolve, 300))

            const isDarkStyle = (['cyber', 'street', 'neon', 'minimalDark', 'grid'] as string[]).includes(config.style)
            const pngDataUrl = await toPng(posterRef.current, {
                quality: 1.0,
                pixelRatio: 3,
                backgroundColor: isDarkStyle ? '#000000' : '#ffffff',
                width: posterRef.current.scrollWidth || config.posterSize?.width || 800,
                height: posterRef.current.scrollHeight || config.posterSize?.height || 1000,
                style: {
                    transform: 'none',
                    transformOrigin: 'top left',
                }
            })

            const itemName = order.items[0]?.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'order'
            const customerName = order.customer.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const timestamp = format(new Date(), 'yyyyMMdd_HHmm')

            let finalDataUrl = pngDataUrl
            let fileExt = 'png'

            // Apply JPEG compression if enabled in global settings
            if (globalConfig.posterCompressionEnabled) {
                const quality = globalConfig.posterCompressionQuality ?? 0.85
                await new Promise<void>((resolve, reject) => {
                    const img = new Image()
                    img.onload = () => {
                        const canvas = document.createElement('canvas')
                        canvas.width = img.naturalWidth
                        canvas.height = img.naturalHeight
                        const ctx = canvas.getContext('2d')
                        if (!ctx) { resolve(); return }
                        ctx.fillStyle = isDarkStyle ? '#000000' : '#ffffff'
                        ctx.fillRect(0, 0, canvas.width, canvas.height)
                        ctx.drawImage(img, 0, 0)
                        finalDataUrl = canvas.toDataURL('image/jpeg', quality)
                        fileExt = 'jpg'
                        resolve()
                    }
                    img.onerror = reject
                    img.src = pngDataUrl
                })
            }

            const link = document.createElement('a')
            link.download = `SoleFlow_${itemName}_${customerName}_${config.style}_${timestamp}.${fileExt}`
            link.href = finalDataUrl
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success(isChinese ? '海报下载成功' : 'Poster downloaded successfully')
        } catch (err) {
            console.error("Failed to generate image", err)
            toast.error(isChinese ? '海报生成失败' : 'Failed to generate poster')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('poster.generate')} maxWidth="max-w-6xl">
            <div className="flex flex-col lg:flex-row gap-8 min-h-[700px] h-[90vh]">
                {/* Preview Area */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-3xl py-12 px-4 flex items-start justify-center overflow-auto border border-slate-200 dark:border-white/5 shadow-inner relative group scrollbar-hide">
                    <div className="flex-shrink-0 origin-top transition-all duration-500 ease-in-out shadow-2xl hover:shadow-primary/20 bg-white"
                        style={{
                            width: `${config.posterSize?.width || 800}px`,
                            minHeight: `${config.posterSize?.height || 1000}px`,
                            height: 'max-content',
                            transform: `scale(${Math.min(0.85, 750 / (config.posterSize?.height || 1000))})`,
                            marginBottom: '100px'
                        }}>
                        <OrderPoster
                            ref={posterRef}
                            order={order}
                            config={{
                                ...config,
                                brandName: globalConfig.brandName,
                                brandLogo: globalConfig.logo || undefined
                            }}
                        />
                    </div>

                    {/* Size Indicator Badge */}
                    <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white/80 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        {config.posterSize?.width} × {config.posterSize?.height} PX
                    </div>
                </div>

                {/* Controls Area */}
                <div className="w-full lg:w-[420px] space-y-8 flex flex-col bg-white/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-white/20 dark:border-white/5 backdrop-blur-sm overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide space-y-8 custom-scrollbar pb-8">
                        {/* Style Selector */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Palette size={14} className="text-primary" />
                                    <Label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">{t('settings.posterStyle')}</Label>
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded-md">
                                    {isChinese ? `${STYLES.length} 款风格` : `${STYLES.length} STYLES`}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {STYLES.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setConfig(prev => ({ ...prev, style: s.id as any }))}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border",
                                            config.style === s.id
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-[1.02]"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500 hover:border-primary/30 hover:bg-primary/5"
                                        )}
                                    >
                                        <s.icon size={14} className="shrink-0" />
                                        <span className="truncate">{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Brand Customization */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-primary" />
                                <Label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">{t('poster.brandCustomization')}</Label>
                            </div>
                            <div className="space-y-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-slate-400">{t('poster.brandName')}</Label>
                                        <input
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                            value={globalConfig.brandName}
                                            onChange={e => globalConfig.setBrandName(e.target.value)}
                                            placeholder="Enter brand name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-slate-400">{t('poster.brandLogo')}</Label>
                                        <div className="flex items-center gap-3">
                                            {globalConfig.logo ? (
                                                <div className="relative group">
                                                    <img src={globalConfig.logo} className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-white/10" />
                                                    <button
                                                        onClick={() => globalConfig.setLogo(null)}
                                                        className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => document.getElementById('brand-logo-upload')?.click()}
                                                    className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:border-primary/50 hover:text-primary transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            )}
                                            <input
                                                id="brand-logo-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            globalConfig.setLogo(reader.result as string)
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                            <span className="text-[10px] text-slate-400 line-clamp-1">{globalConfig.logo ? 'Logo uploaded' : 'Upload PNG/SVG'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-slate-400">{t('poster.position')}</Label>
                                            <Select
                                                className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px]"
                                                value={config.brandPosition}
                                                onChange={e => setConfig(prev => ({ ...prev, brandPosition: e.target.value as any }))}
                                            >
                                                <option value="top-left">Top Left</option>
                                                <option value="top-right">Top Right</option>
                                                <option value="bottom-left">Bottom Left</option>
                                                <option value="bottom-right">Bottom Right</option>
                                                <option value="top">Top Center</option>
                                                <option value="bottom">Bottom Center</option>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-slate-400">{t('poster.brandColor')}</Label>
                                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                                <input
                                                    type="color"
                                                    value={config.brandColor}
                                                    onChange={e => setConfig(prev => ({ ...prev, brandColor: e.target.value }))}
                                                    className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
                                                />
                                                <span className="text-[9px] font-mono opacity-50 uppercase">{config.brandColor}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 border-t border-slate-200 dark:border-white/5 pt-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <Label className="text-[11px] font-bold text-slate-400">{t('poster.logoSize')}</Label>
                                            <span className="text-[10px] font-mono text-primary font-bold">{Math.round((config.logoScale || 1) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0.2" max="3.0" step="0.1"
                                            value={config.logoScale || 1}
                                            onChange={e => setConfig(prev => ({ ...prev, logoScale: parseFloat(e.target.value) }))}
                                            className="w-full h-1.5 bg-white dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <Label className="text-[11px] font-bold text-slate-400">{t('poster.logoX')}</Label>
                                                <span className="text-[10px] font-mono text-primary font-bold">{config.logoX}px</span>
                                            </div>
                                            <input
                                                type="range" min="-300" max="300" step="1"
                                                value={config.logoX || 0}
                                                onChange={e => setConfig(prev => ({ ...prev, logoX: parseInt(e.target.value) }))}
                                                className="w-full h-1.5 bg-white dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <Label className="text-[11px] font-bold text-slate-400">{t('poster.logoY')}</Label>
                                                <span className="text-[10px] font-mono text-primary font-bold">{config.logoY}px</span>
                                            </div>
                                            <input
                                                type="range" min="-300" max="300" step="1"
                                                value={config.logoY || 0}
                                                onChange={e => setConfig(prev => ({ ...prev, logoY: parseInt(e.target.value) }))}
                                                className="w-full h-1.5 bg-white dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Shoe Manipulation */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <ImageIcon size={14} className="text-primary" />
                                <Label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">{t('poster.shoeAdjustment')}</Label>
                            </div>
                            <div className="space-y-5 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <Label className="text-[11px] font-bold text-slate-400">{t('poster.rotation')}</Label>
                                        <span className="text-[10px] font-mono text-primary font-bold">{config.shoeRotation}°</span>
                                    </div>
                                    <input
                                        type="range" min="-180" max="180" step="1"
                                        value={config.shoeRotation || 0}
                                        onChange={e => setConfig(prev => ({ ...prev, shoeRotation: parseInt(e.target.value) }))}
                                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <Label className="text-[11px] font-bold text-slate-400">{t('poster.xOffset')}</Label>
                                        <span className="text-[10px] font-mono text-primary font-bold">{config.shoeX}px</span>
                                    </div>
                                    <input
                                        type="range" min="-200" max="200" step="1"
                                        value={config.shoeX || 0}
                                        onChange={e => setConfig(prev => ({ ...prev, shoeX: parseInt(e.target.value) }))}
                                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <Label className="text-[11px] font-bold text-slate-400">{t('poster.yOffset')}</Label>
                                        <span className="text-[10px] font-mono text-primary font-bold">{config.shoeY}px</span>
                                    </div>
                                    <input
                                        type="range" min="-200" max="200" step="1"
                                        value={config.shoeY || 0}
                                        onChange={e => setConfig(prev => ({ ...prev, shoeY: parseInt(e.target.value) }))}
                                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Basic Controls */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Settings2 size={14} className="text-primary" />
                                <Label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">{t('poster.customize')}</Label>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'showPrice', label: t('poster.showPrice') },
                                    { id: 'showAddress', label: t('poster.showAddress') },
                                    { id: 'showTracking', label: t('poster.showTracking') },
                                    { id: 'showShoeName', label: t('poster.showShoeName') },
                                    { id: 'showOrderId', label: t('poster.showOrderId') },
                                ].map(opt => (
                                    <label key={opt.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10 group">
                                        <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">{opt.label}</span>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={(config as any)[opt.id]}
                                                onChange={e => setConfig(prev => ({ ...prev, [opt.id]: e.target.checked }))}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Visual Quality */}
                        <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Monitor size={14} className="text-primary" />
                                <Label className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">{isChinese ? '外观细节' : 'Appearance'}</Label>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-slate-400 translate-x-1">{isChinese ? '自定义展示名称' : 'Display Name'}</Label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        value={config.shoeNameOverride}
                                        placeholder={order.items[0]?.name}
                                        onChange={e => setConfig(prev => ({ ...prev, shoeNameOverride: e.target.value }))}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <Label className="text-[11px] font-bold text-slate-400">{isChinese ? '图片缩放' : 'Img Scale'}</Label>
                                            <span className="text-[10px] font-mono text-primary font-bold">{Math.round((config.imageScale || 1) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0.5" max="2.0" step="0.05"
                                            value={config.imageScale || 1}
                                            onChange={e => setConfig(prev => ({ ...prev, imageScale: parseFloat(e.target.value) }))}
                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <Label className="text-[11px] font-bold text-slate-400">{isChinese ? '字号调整' : 'Font Size'}</Label>
                                            <span className="text-[10px] font-mono text-primary font-bold">{Math.round((config.fontSizeScale || 1) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0.8" max="1.5" step="0.05"
                                            value={config.fontSizeScale || 1}
                                            onChange={e => setConfig(prev => ({ ...prev, fontSizeScale: parseFloat(e.target.value) }))}
                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-slate-400 translate-x-1">{isChinese ? '海报尺寸' : 'Poster Size'}</Label>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {SIZE_PRESETS.map(preset => (
                                            <button
                                                key={preset.label}
                                                onClick={() => setConfig(prev => ({ ...prev, posterSize: preset }))}
                                                className={cn(
                                                    "px-3 py-2.5 rounded-xl text-[11px] font-bold border transition-all truncate",
                                                    config.posterSize?.label === preset.label
                                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md shadow-black/10"
                                                        : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
                                                )}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-400 ml-1">{isChinese ? '宽度 (px)' : 'Width (px)'}</Label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                value={config.posterSize?.width}
                                                onChange={e => setConfig(prev => ({
                                                    ...prev,
                                                    posterSize: {
                                                        width: parseInt(e.target.value) || 0,
                                                        height: prev.posterSize?.height || 1000,
                                                        label: 'Custom'
                                                    }
                                                }))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-400 ml-1">{isChinese ? '高度 (px)' : 'Height (px)'}</Label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                value={config.posterSize?.height}
                                                onChange={e => setConfig(prev => ({
                                                    ...prev,
                                                    posterSize: {
                                                        width: prev.posterSize?.width || 800,
                                                        height: parseInt(e.target.value) || 0,
                                                        label: 'Custom'
                                                    }
                                                }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-slate-400">{isChinese ? '背景' : 'BG'}</Label>
                                        <div className="relative w-full h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                                            <input
                                                type="color"
                                                value={config.backgroundColor || '#ffffff'}
                                                onChange={e => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                                                className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-slate-400">{isChinese ? '文字' : 'Text'}</Label>
                                        <div className="relative w-full h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                                            <input
                                                type="color"
                                                value={config.textColor || '#000000'}
                                                onChange={e => setConfig(prev => ({ ...prev, textColor: e.target.value }))}
                                                className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-slate-400">{isChinese ? '主题' : 'Color'}</Label>
                                        <div className="relative w-full h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                                            <input
                                                type="color"
                                                value={config.primaryColor || '#000000'}
                                                onChange={e => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/5 mt-auto">
                        <Button
                            className="w-full h-14 rounded-2xl text-md font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={handleDownload}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <span className="flex items-center gap-3">
                                    <Loader2 className="animate-spin" size={20} />
                                    {t('poster.generating')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-3">
                                    <Download size={20} /> {t('poster.download')}
                                </span>
                            )}
                        </Button>

                        {/* Compression info badge */}
                        <div className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold border",
                            globalConfig.posterCompressionEnabled
                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-white/5 text-slate-400"
                        )}>
                            <span className="flex items-center gap-1.5">
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    globalConfig.posterCompressionEnabled ? "bg-emerald-500" : "bg-slate-400"
                                )} />
                                {globalConfig.posterCompressionEnabled
                                    ? (isChinese ? '压缩已启用' : 'Compression ON')
                                    : (isChinese ? '压缩已关闭' : 'Compression OFF')
                                }
                            </span>
                            <span className="font-mono opacity-70">
                                {globalConfig.posterCompressionEnabled
                                    ? `JPG · Q${Math.round((globalConfig.posterCompressionQuality ?? 0.85) * 100)}`
                                    : 'PNG · Lossless'
                                }
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="ghost" className="h-12 rounded-xl text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-200" onClick={handleRestoreDefault}>
                                {isChinese ? '恢复默认' : 'Restore Default'}
                            </Button>
                            <Button variant="ghost" className="h-12 rounded-xl text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-200" onClick={onClose}>
                                {t('poster.close')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal >
    )
}
