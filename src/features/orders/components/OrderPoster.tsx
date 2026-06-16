import { forwardRef } from 'react'
import type { Order } from '@/types/order'
import { SIZE_MAPPING } from '@/types/order'
import { Logo } from '@/components/Logo'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface OrderPosterProps {
    order: Order
    config: {
        showPrice: boolean
        showAddress: boolean
        showTracking: boolean
        showShoeName: boolean
        showOrderId: boolean
        style?: 'classic' | 'modern' | 'cyber' | 'luxury' | 'minimalist' | 'receipt' | 'street' | 'retro' | 'business' | 'sports' | 'art' | 'tech' | 'magazine' | 'industrial' | 'nature' | 'urban' | 'typography' | 'gradient' | 'ink' | 'neon' | 'paper' | 'vibrant' | 'polaroid' | 'minimalDark' | 'elegant' | 'comic' | 'grid' | 'aura' | 'flash' | 'blueprint' | 'glass'
        shoeNameOverride?: string
        layoutMode?: 'center' | 'left' | 'right'
        imageScale?: number
        fontSizeScale?: number
        primaryColor?: string
        backgroundColor?: string
        textColor?: string
        posterSize?: { width: number; height: number; label: string }
        brandName?: string
        brandLogo?: string
        brandPosition?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
        brandColor?: string
        logoScale?: number
        logoX?: number
        logoY?: number
        shoeRotation?: number
        shoeX?: number
        shoeY?: number
    }
}

export const OrderPoster = forwardRef<HTMLDivElement, OrderPosterProps>(({ order: rawOrder, config }, ref) => {
    const { i18n } = useTranslation()
    const isChinese = i18n.language.startsWith('zh')
    
    const processedItems = rawOrder.items.map(item => {
        if (item.isExchanged) {
            const exchangeDisplaySize = item.exchangeSize || item.size;
            return {
                ...item,
                size: exchangeDisplaySize,
                name: `${item.name} (${isChinese ? '已换货' : 'Exchanged'})`
            };
        }
        return item;
    });

    const order = {
        ...rawOrder,
        items: processedItems
    };

    const style = config.style || 'classic'
    const activeItems = order.items.filter(item => !item.isRefunded)
    if (activeItems.length === 0) return null

    const displayShoeName = config.shoeNameOverride || activeItems[0]?.name || ''
    const primaryColor = config.primaryColor || '#000000'
    const bgColor = config.backgroundColor || '#ffffff'
    const textColor = config.textColor || '#000000'
    const imgScale = config.imageScale || 1
    const fontScale = config.fontSizeScale || 1
    const shoeRotation = config.shoeRotation || 0
    const shoeX = config.shoeX || 0
    const shoeY = config.shoeY || 0
    const brandName = config.brandName || ''
    const brandLogo = config.brandLogo || ''
    const brandPosition = config.brandPosition || 'top-right'
    const brandColor = config.brandColor || textColor
    const logoScale = config.logoScale || 1
    const logoX = config.logoX || 0
    const logoY = config.logoY || 0

    const getDisplaySize = (item: any) => {
        const sizeInfo = SIZE_MAPPING.find(s => s.eur === item.size)
        return isChinese ? `${item.size} 码` : `US ${sizeInfo?.us || item.size}`
    }

    const getTrackingDisplay = () => {
        if (!order.shipping.trackingNumber) return ''
        const company = order.shipping.company as string
        const mapping: Record<string, string> = {
            'SF': '顺丰速运',
            'YTO': '圆通速递',
            'STO': '申通快递',
            'ZTO': '中通快递',
            'YD': '韵达快递',
            'EMS': '邮政EMS',
            'J&T': '极兔速递',
            'Postal': '邮政包裹'
        }
        const label = isChinese ? (mapping[company] || company) : company
        return `${label}: ${order.shipping.trackingNumber}`
    }

    const RenderBrand = ({ className, absolute = false }: { className?: string; absolute?: boolean }) => {
        if (!brandName && !brandLogo && !absolute) return <Logo className={className} />

        const positionClasses = {
            'top-left': 'top-8 left-8',
            'top-right': 'top-8 right-8',
            'bottom-left': 'bottom-8 left-8',
            'bottom-right': 'bottom-8 right-8',
            'top': 'top-8 left-1/2 -translate-x-1/2',
            'bottom': 'bottom-8 left-1/2 -translate-x-1/2',
            'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        }

        const brandContent = (
            <div className={cn("flex items-center gap-3 z-[50] transition-transform", !absolute && className, absolute && "absolute " + positionClasses[brandPosition])} style={{ transform: `scale(${logoScale}) translate(${logoX}px, ${logoY}px)` }}>
                {brandLogo ? (
                    <img src={brandLogo} className="w-12 h-12 object-contain" />
                ) : (
                    <Logo className={cn("scale-125", !brandName && "scale-100")} hideText={!!brandName} />
                )}
                {brandName && (
                    <span className="font-black tracking-tighter text-2xl uppercase" style={{ color: brandColor }}>
                        {brandName}
                    </span>
                )}
            </div>
        )

        return brandContent
    }

    const renderCyber = () => (
        <div className="relative z-10 w-full h-full flex flex-col p-12 bg-slate-950 text-white overflow-hidden" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : undefined, color: textColor !== '#000000' ? textColor : 'white' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined, opacity: 0.2 }} />

            <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                    <RenderBrand className="invert scale-150 origin-left" />
                    <p className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold opacity-80 mt-4 ml-1" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>Authentic Gear Only</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono" style={{ color: textColor !== '#000000' ? `${textColor}80` : undefined }}>ID: {config.showOrderId ? order.id.slice(0, 8).toUpperCase() : '****'}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-12 py-4">
                {activeItems.map((item, idx) => (
                    <div key={idx} className="relative group">
                        <div className="flex items-center gap-8">
                            <div className="w-1/2 aspect-video bg-gradient-to-tr from-white/5 to-transparent rounded-3xl p-4 relative overflow-hidden flex items-center justify-center">
                                {item.image && (
                                    <img
                                        src={item.image}
                                        className="w-full h-full object-contain relative z-[5] drop-shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-transform"
                                        style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                                    />
                                )}
                                <div className="absolute bottom-2 right-2 bg-primary text-black font-black px-4 py-1.5 rounded-xl text-lg skew-x-[-10deg] z-10" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                                    {isChinese ? (item.category === 'clothes' || item.category === 'pants' ? `${item.size}` : `${item.size} EUR`) : getDisplaySize(item)}
                                </div>
                            </div>
                            <div className="w-1/2 space-y-4" style={{ transform: `scale(${fontScale})`, transformOrigin: 'left center' }}>
                                <div>
                                    <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>Item {idx + 1}</p>
                                    {config.showShoeName && <h3 className="text-2xl font-black tracking-tight uppercase line-clamp-2" style={{ color: textColor }}>{item.name}</h3>}
                                </div>
                                <div className="flex items-center justify-between border-t border-white/10 pt-4" style={{ borderColor: textColor !== '#000000' ? `${textColor}20` : undefined }}>
                                    <span className="text-slate-500 text-xs" style={{ color: textColor !== '#000000' ? `${textColor}60` : undefined }}>Qty: {item.quantity}</span>
                                    {config.showPrice && <span className="text-xl font-bold italic" style={{ color: textColor }}>¥ {item.price.toLocaleString()}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 mt-8 relative overflow-hidden" style={{ borderColor: textColor !== '#000000' ? `${textColor}20` : undefined }}>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent" style={{ '--tw-gradient-via': primaryColor !== '#000000' ? primaryColor : undefined } as any} />
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-2" style={{ color: textColor !== '#000000' ? `${textColor}60` : undefined }}>Customer</p>
                        <p className="text-lg font-bold" style={{ color: textColor }}>{order.customer.name}</p>
                        <p className="text-slate-400 text-sm" style={{ color: textColor !== '#000000' ? `${textColor}80` : undefined }}>{order.customer.phone}</p>
                        {config.showAddress && <p className="text-slate-500 text-xs mt-2 line-clamp-2" style={{ color: textColor !== '#000000' ? `${textColor}60` : undefined }}>{order.customer.address}</p>}
                        {config.showTracking && (
                            <p className="text-[10px] font-mono mt-3 opacity-60" style={{ color: textColor }}>{getTrackingDisplay()}</p>
                        )}
                    </div>
                    {config.showPrice && (
                        <div className="text-right flex flex-col justify-center">
                            <p className="text-primary font-bold text-[10px] uppercase tracking-widest" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>Grand Total</p>
                            <p className="text-4xl font-black italic tracking-tighter" style={{ color: textColor }}>¥ {order.totalAmount.toLocaleString()}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    const renderLuxury = () => (
        <div className="relative z-10 w-full h-full flex flex-col p-20 bg-slate-900 text-amber-50 overflow-hidden font-serif" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : undefined, color: textColor !== '#000000' ? textColor : undefined }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
            </div>

            <div className="border-b border-amber-900/30 pb-12 flex justify-between items-end" style={{ borderColor: primaryColor !== '#000000' ? `${primaryColor}4D` : undefined }}>
                <div>
                    {!brandName && !brandLogo && <Logo className="invert scale-150 origin-left brightness-200" />}
                    <div className="h-1 w-24 bg-amber-500 mt-6" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
                </div>
                <div className="text-right space-y-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-amber-500/60 font-sans" style={{ color: primaryColor !== '#000000' ? `${primaryColor}99` : undefined }}>Certificate of Acquisition</p>
                    <p className="text-2xl font-light tracking-widest">{format(new Date(order.createdAt), 'MMMM d, yyyy')}</p>
                </div>
            </div>

            <div className="flex-1 py-12 space-y-16 overflow-y-auto scrollbar-hide">
                {activeItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <div className="aspect-square bg-white/5 rounded-full blur-[100px] absolute inset-0" />
                            {item.image && (
                                <img
                                    src={item.image}
                                    className="w-full relative z-10 drop-shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
                                    style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                                />
                            )}
                        </div>
                        <div className="space-y-6" style={{ transform: `scale(${fontScale})`, transformOrigin: 'left center' }}>
                            <p className="text-amber-500/60 text-xs font-sans uppercase tracking-[0.3em]" style={{ color: primaryColor !== '#000000' ? `${primaryColor}99` : undefined }}>Exotic Collection</p>
                            {config.showShoeName && <h2 className="text-3xl font-light leading-snug">{item.name}</h2>}
                            <div className="grid grid-cols-2 gap-8 border-t border-amber-900/20 pt-6" style={{ borderColor: primaryColor !== '#000000' ? `${primaryColor}33` : undefined }}>
                                <div>
                                    <p className="text-[10px] font-sans uppercase text-amber-500/40 mb-1" style={{ color: primaryColor !== '#000000' ? `${primaryColor}66` : undefined }}>Specifications</p>
                                    <p className="font-sans text-sm tracking-widest">{item.category === 'clothes' || item.category === 'pants' ? item.size : `${item.size} EUR`}</p>
                                </div>
                                {config.showPrice && (
                                    <div className="text-right">
                                        <p className="text-[10px] font-sans uppercase text-amber-500/40 mb-1" style={{ color: primaryColor !== '#000000' ? `${primaryColor}66` : undefined }}>Value</p>
                                        <p className="text-xl">¥ {item.price.toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-12 border-t border-amber-900/30 grid grid-cols-3 gap-8 items-center" style={{ borderColor: primaryColor !== '#000000' ? `${primaryColor}4D` : undefined }}>
                <div className="col-span-2">
                    <p className="text-[10px] font-sans uppercase text-amber-500/40 mb-2 tracking-[0.2em]" style={{ color: primaryColor !== '#000000' ? `${primaryColor}66` : undefined }}>Prepared Personally For</p>
                    <p className="text-2xl font-light tracking-wide">{order.customer.name}</p>
                    {config.showAddress && <p className="text-amber-500/40 text-xs font-sans mt-2 max-w-sm italic opacity-60 truncate" style={{ color: primaryColor !== '#000000' ? `${primaryColor}66` : undefined }}>{order.customer.address}</p>}
                </div>
                {config.showPrice && (
                    <div className="text-right">
                        <p className="text-[10px] font-sans uppercase text-amber-500/40 mb-2 tracking-[0.2em]" style={{ color: primaryColor !== '#000000' ? `${primaryColor}66` : undefined }}>Total Value</p>
                        <p className="text-4xl font-light text-amber-500" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>¥ {order.totalAmount.toLocaleString()}</p>
                    </div>
                )}
            </div>
        </div>
    )

    const renderMinimalist = () => (
        <div className="relative z-10 w-full h-full flex flex-col p-16 bg-white text-slate-800 font-sans" style={{ backgroundColor: bgColor, color: textColor }}>
            <div className="flex justify-between items-start mb-16 px-4">
                {!brandName && !brandLogo && <Logo className="scale-110" />}
                <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Confirmed</p>
                    <p className="text-sm text-slate-400">{format(new Date(order.createdAt), 'dd.MM.yyyy')}</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-12 px-4 overflow-y-auto scrollbar-hide py-4">
                {activeItems.map((item, idx) => (
                    <div key={idx} className="space-y-6">
                        <div className="aspect-square bg-slate-50 rounded-[2.5rem] flex items-center justify-center p-8 border border-slate-100">
                            {item.image && (
                                <img
                                    src={item.image}
                                    className="w-full h-full object-contain mix-blend-multiply"
                                    style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                                />
                            )}
                        </div>
                        <div className="space-y-2" style={{ transform: `scale(${fontScale})`, transformOrigin: 'top left' }}>
                            <div className="flex justify-between items-start">
                                {config.showShoeName && <h3 className="font-bold text-lg leading-tight flex-1 mr-2">{item.name}</h3>}
                                {config.showPrice && <span className="font-mono text-sm opacity-60">x{item.quantity}</span>}
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-400 tracking-widest uppercase">
                                <span>{item.category === 'clothes' || item.category === 'pants' ? item.size : `${item.size} EUR`}</span>
                                {config.showPrice && <span>¥ {item.price.toLocaleString()}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-16 bg-slate-50 rounded-[3rem] p-12 grid grid-cols-2 gap-12 items-end">
                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Recipient</p>
                        <p className="text-2xl font-bold">{order.customer.name}</p>
                        <p className="text-slate-400 text-sm mt-1">{order.customer.phone}</p>
                    </div>
                    {config.showAddress && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Ship To</p>
                            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">{order.customer.address}</p>
                        </div>
                    )}
                </div>
                {config.showPrice && (
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Total Payable</p>
                        <p className="text-5xl font-black italic tracking-tighter text-slate-900" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>¥ {order.totalAmount.toLocaleString()}</p>
                    </div>
                )}
            </div>
        </div>
    )

    const renderReceipt = () => (
        <div className="relative z-10 w-full h-full flex flex-col p-12 bg-[#F5F2EA] text-slate-700 font-mono text-sm overflow-hidden border-[15px] border-white shadow-inner" style={{ backgroundColor: bgColor, color: textColor }}>
            <div className="text-center space-y-4 mb-8">
                {!brandName && !brandLogo && <Logo className="mx-auto grayscale opacity-80" />}
                <div className="space-y-1">
                    <p className="font-bold text-xl tracking-[0.3em]">SOLEFLOW AUTHENTICS</p>
                    <p className="opacity-60">Verified Secondary Market Goods</p>
                </div>
                <div className="border-y-2 border-dashed border-slate-300 py-2">
                    <p>ORDER: #{config.showOrderId ? order.id.slice(0, 12).toUpperCase() : '****'}</p>
                    <p>{format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss')}</p>
                </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto scrollbar-hide py-4" style={{ transform: `scale(${fontScale})`, transformOrigin: 'top center' }}>
                <div className="grid grid-cols-12 font-bold border-b-2 border-slate-300 pb-2 mb-4">
                    <div className="col-span-6">ITEM DESCRIPTION</div>
                    <div className="col-span-2 text-center">SIZE</div>
                    <div className="col-span-4 text-right">AMOUNT</div>
                </div>
                {activeItems.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="grid grid-cols-12">
                            <div className="col-span-6 font-bold">{config.showShoeName ? item.name : '---'}</div>
                            <div className="col-span-2 text-center">{item.size}</div>
                            <div className="col-span-4 text-right">{config.showPrice ? `¥${item.price.toLocaleString()}` : '---'}</div>
                        </div>
                        <div className="grid grid-cols-12 text-xs opacity-60">
                            <div className="col-span-6">QUANTITY: {item.quantity}</div>
                            <div className="col-span-6 text-right">SUB: ¥{(item.price * item.quantity).toLocaleString()}</div>
                        </div>
                        <div className="w-32 h-20 mx-auto my-4 opacity-10">
                            {item.image && (
                                <img
                                    src={item.image}
                                    className="w-full h-full object-contain drop-shadow-xl"
                                    style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 border-t-2 border-dashed border-slate-300 pt-6 space-y-4">
                {config.showPrice && (
                    <div className="flex justify-between items-end font-bold text-xl">
                        <span>TOTAL AMOUNT DUE</span>
                        <span>¥ {order.totalAmount.toLocaleString()}</span>
                    </div>
                )}

                <div className="space-y-1 opacity-80 text-xs">
                    <p className="font-bold">CUSTOMER DETAILS:</p>
                    <p>NAME: {order.customer.name}</p>
                    <p>PHONE: {order.customer.phone}</p>
                    {config.showAddress && <p className="truncate">ADDR: {order.customer.address}</p>}
                    {config.showTracking && <p>TRACK: {order.shipping.company} - {order.shipping.trackingNumber}</p>}
                </div>

                <div className="text-center pt-8 space-y-4">
                    <div className="w-full h-12 bg-[url('https://barcodeapi.org/api/128/SOLEFLOW')] bg-no-repeat bg-center mix-blend-multiply opacity-20" />
                    <p className="text-[10px] tracking-[0.5em] font-bold">--- THANK YOU FOR SHOPPING ---</p>
                </div>
            </div>
        </div>
    )

    const renderDefault = () => (
        <div className="relative z-10 w-full h-full flex flex-col p-12 bg-slate-50" style={{ backgroundColor: bgColor, color: textColor }}>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 blur-[100px] rounded-full" style={{ backgroundColor: primaryColor, opacity: 0.1 }} />
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary/10 blur-[100px] rounded-full" style={{ backgroundColor: primaryColor, opacity: 0.1 }} />
            </div>

            <div className={`relative z-10 flex flex-col h-full ${activeItems.length === 1 ? 'justify-between' : ''}`}>
                <div className="flex justify-between items-center mb-8">
                    {!brandName && !brandLogo && <Logo className="scale-125" />}
                    <div className="text-right">
                        <p className="text-sm font-bold tracking-widest uppercase text-slate-400">Official Invoice</p>
                        <p className="text-xs text-slate-400 mt-1">{format(new Date(order.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                </div>

                <div className={`overflow-y-auto scrollbar-hide py-2 space-y-6 ${activeItems.length === 1 ? 'flex-1 flex items-center' : 'flex-1'}`}>
                    <div className={activeItems.length === 1 ? 'w-full' : ''}>
                        {activeItems.map((item, idx) => (
                            <div key={idx} className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white p-6 flex gap-6 items-center shadow-sm mb-6 last:mb-0">
                                <div className="w-32 h-24 flex items-center justify-center">
                                    {item.image && (
                                        <img
                                            src={item.image}
                                            className="w-full h-full object-contain drop-shadow-lg"
                                            style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0" style={{ transform: `scale(${fontScale})`, transformOrigin: 'left center' }}>
                                    {config.showShoeName && <h3 className="font-bold text-lg text-slate-900 truncate">{item.name}</h3>}
                                    <div className="flex gap-4 mt-2">
                                        <span className="text-xs font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-tighter" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>{item.category === 'clothes' || item.category === 'pants' ? item.size : `EUR ${item.size}`}</span>
                                        <span className="text-xs font-bold text-slate-400 flex items-center uppercase tracking-widest">Qty: {item.quantity}</span>
                                    </div>
                                </div>
                                {config.showPrice && <div className="text-right font-black text-xl text-primary" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>¥ {item.price.toLocaleString()}</div>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white">
                    <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-300 mb-2">{isChinese ? '收件人' : 'Recipient'}</p>
                                    <p className="text-xl font-bold">{order.customer.name}</p>
                                    <p className="text-slate-500 text-sm">{order.customer.phone}</p>
                                </div>
                                {config.showTracking && (
                                    <div className="text-right">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-300 mb-2">{isChinese ? '单号' : 'Tracking'}</p>
                                        <p className="text-sm font-mono font-bold">{order.shipping.trackingNumber}</p>
                                        <p className="text-[10px] text-slate-400 uppercase">{order.shipping.company}</p>
                                    </div>
                                )}
                            </div>
                            {config.showAddress && (
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">{isChinese ? '地址' : 'Address'}</p>
                                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{order.customer.address}</p>
                                </div>
                            )}
                        </div>
                        {config.showPrice && (
                            <div className="text-right flex flex-col justify-end">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-300 mb-2">Final Amount</p>
                                <p className="text-5xl font-black italic tracking-tighter text-primary" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>¥ {order.totalAmount.toLocaleString()}</p>
                                <div className="w-full h-1 bg-primary mt-4 opacity-20" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {config.showOrderId && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-20">
                    ORDER_ID: {order.id.toUpperCase()}
                </div>
            )}
        </div>
    )

    const renderModern = () => (
        <div className="relative z-10 w-full h-full flex flex-col p-16 bg-white text-slate-900" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : undefined, color: primaryColor !== '#000000' ? primaryColor : undefined }}>
            <div className="flex justify-between items-center mb-16 px-4">
                <Logo />
                <div className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-30">SoleFlow Verified</div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-4 space-y-16">
                {activeItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-12 items-center">
                        <div className="col-span-5 relative">
                            <div className="aspect-square bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-100">
                                {item.image && (
                                    <img
                                        src={item.image}
                                        className="w-full h-full object-contain drop-shadow-xl"
                                        style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                                    />
                                )}
                            </div>
                            <div className="absolute -bottom-4 -right-4 bg-slate-900 text-white font-black px-4 py-2 rounded-lg text-lg" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                                {item.size}
                            </div>
                        </div>
                        <div className="col-span-7 space-y-6" style={{ transform: `scale(${fontScale})`, transformOrigin: 'left center' }}>
                            <div>
                                {config.showShoeName && <h3 className="text-4xl font-light tracking-tight leading-tight">{item.name}</h3>}
                                <div className="h-0.5 w-12 bg-slate-900 mt-4" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
                            </div>
                            <div className="flex items-center gap-12 text-xs font-bold tracking-[0.2em] transform uppercase">
                                <span>{item.category === 'clothes' || item.category === 'pants' ? item.size : `EUR ${item.size}`}</span>
                                <span>QTY {item.quantity}</span>
                                {config.showPrice && <span className="text-slate-400">¥ {item.price.toLocaleString()}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-16 pt-16 border-t border-slate-100 px-4 grid grid-cols-3 gap-12">
                <div className="col-span-2 flex gap-12">
                    <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isChinese ? '收件人' : 'Consignee'}</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">{order.customer.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{order.customer.phone}</p>
                            </div>
                            {config.showTracking && (
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isChinese ? '运单号' : 'Tracking'}</p>
                                    <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{order.shipping.trackingNumber}</p>
                                </div>
                            )}
                        </div>
                        {config.showAddress && <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">{order.customer.address}</p>}
                    </div>
                </div>
                {config.showPrice && (
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-300 mb-3">Total Payable</p>
                        <p className="text-4xl font-light">¥ {order.totalAmount.toLocaleString()}</p>
                    </div>
                )}
            </div>
        </div>
    )

    const renderNature = () => (
        <div className="w-full h-full relative bg-[#F5F5F0] text-[#2C3E50] overflow-hidden flex flex-col font-serif" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#F5F5F0', color: textColor }}>
            <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-green-100 rounded-full blur-[120px] opacity-60" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined, opacity: 0.2 }} />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-stone-200 rounded-full blur-[100px] opacity-60" />

            <div className="p-12 flex-1 flex flex-col relative z-10">
                <div className="flex justify-between items-center mb-16">
                    <div className="flex items-center gap-3">
                        <Logo className="w-8 h-8 opacity-80" />
                        <span className="text-sm tracking-[0.2em] uppercase font-light">Organic Collection</span>
                    </div>
                    {config.showOrderId && <span className="font-mono text-xs opacity-40">{order.id.slice(0, 8)}</span>}
                </div>

                <div className="flex-1 flex flex-col justify-center items-center relative">
                    {activeItems.map((item, idx) => (
                        <div key={idx} className="relative w-full max-w-lg">
                            <div className="absolute inset-0 border border-current opacity-10 rounded-[50%_40%_30%_70%/60%_30%_70%_40%] animate-[spin_20s_linear_infinite]" />
                            <div className="relative z-10 p-8">
                                {item.image && (
                                    <img
                                        src={item.image}
                                        className="w-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative z-10"
                                        style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                                    />
                                )}
                            </div>
                            <div className="text-center mt-12 space-y-4" style={{ transform: `scale(${fontScale})` }}>
                                {config.showShoeName && <h2 className="text-4xl font-normal leading-tight italic">{displayShoeName}</h2>}
                                <div className="flex items-center justify-center gap-6 text-sm opacity-60 font-sans tracking-widest uppercase">
                                    <span>Size {item.size}</span>
                                    {config.showPrice && <span>¥{item.price}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-current border-opacity-10 text-xs tracking-widest uppercase opacity-60 font-sans">
                    <div>
                        <p className="mb-2 opacity-50">Prepared For</p>
                        <p>{order.customer.name}</p>
                    </div>
                    {config.showAddress && (
                        <div className="col-span-2 text-right">
                            <p className="mb-2 opacity-50">Destination</p>
                            <p>{order.customer.address}</p>
                        </div>
                    )}
                    {config.showTracking && (
                        <div className="col-span-3 text-center">
                            <p className="mb-2 opacity-50">Tracking</p>
                            <p>{getTrackingDisplay()}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )


    const renderTypography = () => (
        <div className="w-full h-full bg-white text-black p-12 flex flex-col relative overflow-hidden font-sans" style={{ backgroundColor: bgColor, color: textColor }}>
            <div className="flex-1 flex flex-col">
                <div className="flex items-baseline justify-between border-b-2 border-black pb-4 mb-8" style={{ borderColor: primaryColor }}>
                    <h1 className="text-6xl font-black tracking-tighter">SF.TYPE</h1>
                    <p className="font-mono text-sm">{format(new Date(), 'dd.MM.yyyy')}</p>
                </div>

                {activeItems.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col relative">
                        {config.showShoeName && (
                            <h2 className="text-8xl font-black leading-[0.8] uppercase tracking-tight break-all z-10 relative mix-blend-difference text-white" style={{ transform: `scale(${fontScale})`, transformOrigin: 'top left', color: '#fff', mixBlendMode: 'difference' }}>
                                {displayShoeName}
                            </h2>
                        )}

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] z-0">
                            {item.image && (
                                <img
                                    src={item.image}
                                    className="w-full object-contain relative z-10"
                                    style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                                />
                            )}
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-8 z-10">
                            <div className="space-y-4">
                                <div className="border-l-2 border-black pl-4" style={{ borderColor: primaryColor }}>
                                    <p className="text-xs font-bold uppercase mb-1">Specification</p>
                                    <p className="text-2xl font-bold">{item.category === 'clothes' || item.category === 'pants' ? item.size : `${item.size} / ${isChinese ? '码' : 'EUR'}`}</p>
                                </div>
                                {config.showPrice && (
                                    <div className="border-l-2 border-black pl-4" style={{ borderColor: primaryColor }}>
                                        <p className="text-xs font-bold uppercase mb-1">Acquisition</p>
                                        <p className="text-2xl font-bold">¥{item.price}</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-right space-y-2">
                                <p className="text-sm font-mono">{order.customer.name}</p>
                                {config.showAddress && <p className="text-sm font-mono max-w-[200px] ml-auto">{order.customer.address}</p>}
                                {config.showOrderId && <p className="text-xs font-mono opacity-50 mt-4">{order.id}</p>}
                                {config.showTracking && <p className="text-xs font-mono opacity-50 mt-4">{getTrackingDisplay()}</p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    const renderGradient = () => (
        <div className="w-full h-full bg-slate-900 text-white relative overflow-hidden flex flex-col p-12" style={{ color: textColor }}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-20" />
            <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-blue-500 rounded-full blur-[150px] mix-blend-screen opacity-40" style={{ backgroundColor: primaryColor }} />
            <div className="absolute -bottom-[20%] -left-[20%] w-[80%] h-[80%] bg-teal-500 rounded-full blur-[150px] mix-blend-screen opacity-40" style={{ backgroundColor: primaryColor }} />

            <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-12">
                    <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
                        <span className="text-xs font-bold tracking-widest uppercase">Gradient Series</span>
                    </div>
                    <Logo className="w-8 h-8" />
                </div>

                {activeItems.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-center relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl" />

                        {item.image && (
                            <img
                                src={item.image}
                                className="w-full max-w-3xl object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative z-10"
                                style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                            />
                        )}

                        {config.showShoeName && (
                            <div className="absolute bottom-10 left-0 w-full text-center z-20">
                                <h2 className="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50 tracking-tight" style={{ transform: `scale(${fontScale})` }}>
                                    {displayShoeName}
                                </h2>
                            </div>
                        )}
                    </div>
                ))}

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-12 grid grid-cols-4 gap-8">
                    <div className="flex-1">
                        <p className="text-white/40 text-xs font-bold uppercase mb-1">Customer</p>
                        <p className="font-bold">{order.customer.name}</p>
                        {config.showTracking && <p className="text-[10px] font-mono opacity-60 mt-2">{getTrackingDisplay()}</p>}
                    </div>
                    <div>
                        <p className="text-white/40 text-xs font-bold uppercase mb-1">Size</p>
                        <p className="font-bold">{activeItems[0]?.size}</p>
                    </div>
                    {config.showPrice && (
                        <div>
                            <p className="text-white/40 text-xs font-bold uppercase mb-1">Price</p>
                            <p className="font-bold">¥{activeItems[0]?.price}</p>
                        </div>
                    )}
                    <div className="flex items-center justify-end">
                        {config.showOrderId && <p className="font-mono text-xs opacity-40">{order.id.slice(0, 8)}</p>}
                    </div>
                </div>
            </div>
        </div>
    )

    // Style implementations

    const renderStreet = () => (
        <div className="relative z-10 w-full h-full bg-black flex flex-col p-16 overflow-hidden font-black" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#000000', color: primaryColor !== '#000000' ? primaryColor : undefined }}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/20 -skew-x-12 translate-x-1/2 blur-3xl text-primary" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }} />

            <div className="relative z-10 flex justify-between items-start">
                <Logo className="invert scale-150 origin-left" />
                <div className="text-right text-primary" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>
                    <p className="text-[10px] tracking-widest">EST. 2024</p>
                    <p className="text-xl italic">SF-{config.showOrderId ? order.id.slice(0, 4).toUpperCase() : '****'}</p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative my-12">
                <div className="absolute scale-[2] opacity-5 text-white whitespace-nowrap overflow-hidden select-none select-none">
                    STREET CULTURE STREET CULTURE STREET CULTURE
                </div>
                {activeItems[0]?.image && (
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
                        {activeItems[0]?.image && (
                            <img
                                src={activeItems[0].image}
                                className="w-full relative z-10 drop-shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                                style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                            />
                        )}
                    </div>
                )}
            </div>

            <div className="relative z-10 space-y-8 bg-black/60 backdrop-blur-md p-6 rounded-3xl border border-white/10" style={{ transform: `scale(${fontScale})`, transformOrigin: 'bottom center' }}>
                <div className="flex justify-between items-end gap-12">
                    <div className="flex-1">
                        <p className="text-primary text-xs tracking-widest mb-1 italic" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>Verified Item</p>
                        {config.showShoeName && <h2 className="text-4xl text-white uppercase italic truncate">{displayShoeName}</h2>}
                    </div>
                    {config.showPrice && <div className="text-5xl text-primary italic" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>¥{order.totalAmount.toLocaleString()}</div>}
                </div>
                <div className="flex justify-between items-center text-white/60 text-xs border-t border-white/10 pt-6 uppercase tracking-widest">
                    <div className="flex-1 pr-8">
                        <span className="text-white">Recipient: {order.customer.name}</span>
                        {config.showAddress && <p className="text-white/80 text-[11px] mt-2 normal-case leading-relaxed">{order.customer.address}</p>}
                        {config.showTracking && <p className="text-primary text-[11px] mt-2 font-mono" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>{order.shipping.company}: {order.shipping.trackingNumber}</p>}
                    </div>
                    <span className="shrink-0 text-[10px] opacity-40">Authorized Distribution</span>
                </div>
            </div>
        </div>
    )
    const renderRetro = () => (
        <div className="relative z-10 w-full h-full bg-[#f4e4bc] flex flex-col p-16 font-serif text-[#4a342e]" style={{ backgroundColor: bgColor, color: textColor }}>
            <div className="absolute inset-0 border-[1.5rem] border-[#d8c5a2] m-4 pointer-events-none" style={{ borderColor: primaryColor !== '#000000' ? `${primaryColor}33` : undefined }} />
            <div className="text-center space-y-6 pt-8">
                <h1 className="text-7xl font-black italic tracking-tighter uppercase drop-shadow-sm">SoleFlow</h1>
                <p className="text-xs font-sans font-bold tracking-[0.4em] uppercase opacity-70">Super-High Quality Footwear</p>
            </div>
            <div className="flex-1 flex items-center justify-center py-4">
                <div className="relative w-full aspect-video bg-[#4a342e]/5 rounded-sm p-8 outline outline-1 outline-offset-4 outline-[#4a342e]/20" style={{ outlineColor: primaryColor !== '#000000' ? `${primaryColor}33` : undefined, backgroundColor: primaryColor !== '#000000' ? `${primaryColor}0D` : undefined }}>
                    {activeItems[0]?.image && (
                        <img
                            src={activeItems[0].image}
                            className="w-full h-full object-contain sepia-[0.3] contrast-[1.1]"
                            style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                        />
                    )}
                    <div className="absolute -top-4 -left-4 bg-[#4a342e] text-[#f4e4bc] px-4 py-2 font-sans font-black uppercase text-sm -rotate-3" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                        New Arrival
                    </div>
                </div>
            </div>
            <div className="space-y-6 text-center" style={{ transform: `scale(${fontScale})` }}>
                <div className="space-y-2">
                    {config.showShoeName && <h3 className="text-4xl font-black uppercase tracking-tight line-clamp-1">{displayShoeName}</h3>}
                    <p className="font-sans font-bold italic opacity-60">Choice of Champions Since '24</p>
                </div>
                <div className="flex justify-center items-center gap-8 pt-4">
                    <div className="text-center flex-1">
                        <p className="text-[10px] font-sans font-black uppercase tracking-widest opacity-40">Client</p>
                        <p className="text-lg font-bold">{order.customer.name}</p>
                        {config.showAddress && <p className="text-xs font-sans opacity-70 mt-1 leading-tight">{order.customer.address}</p>}
                    </div>
                    {config.showPrice && <div className="text-4xl font-black italic border-x-4 border-[#4a342e] px-6 py-2 shrink-0" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>¥{order.totalAmount.toLocaleString()}</div>}
                    <div className="text-center flex-1">
                        <p className="text-[10px] font-sans font-black uppercase tracking-widest opacity-40">Size</p>
                        <p className="text-lg font-bold">{['clothes', 'pants'].includes(activeItems[0]?.category || '') ? activeItems[0]?.size : `${activeItems[0]?.size} EUR`}</p>
                        {config.showTracking && <p className="text-[10px] font-mono opacity-60 mt-2">{getTrackingDisplay()}</p>}
                    </div>
                </div>
            </div>
        </div>
    )

    const renderBusiness = () => (
        <div className="relative z-10 w-full h-full bg-slate-50 flex flex-col p-16 font-sans text-slate-900" style={{ backgroundColor: bgColor, color: textColor }}>
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                <div>
                    <Logo className="scale-125 origin-left" />
                    <p className="text-xs font-bold text-slate-400 mt-4 tracking-widest uppercase">Premium Business Solutions</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Order Reference</p>
                    <p className="text-xl font-mono font-bold tracking-tighter" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>#{config.showOrderId ? order.id.slice(0, 12).toUpperCase() : '****'}</p>
                    <p className="text-sm text-slate-500 mt-1">{format(new Date(order.createdAt), 'yyyy-MM-dd')}</p>
                </div>
            </div>
            <div className="flex-1 flex gap-12 py-12 items-center">
                <div className="w-1/2 aspect-square bg-white rounded-3xl shadow-2xl p-8 flex items-center justify-center border border-slate-100">
                    {activeItems[0]?.image && (
                        <img
                            src={activeItems[0].image}
                            className="w-full h-full object-contain"
                            style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                        />
                    )}
                </div>
                <div className="w-1/2 space-y-8" style={{ transform: `scale(${fontScale})`, transformOrigin: 'left center' }}>
                    <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-2" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>Authenticated Product</p>
                        {config.showShoeName && <h2 className="text-4xl font-black tracking-tight leading-tight">{displayShoeName}</h2>}
                    </div>
                    <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Specifications</p>
                            <p className="text-lg font-bold">Size {['clothes', 'pants'].includes(activeItems[0]?.category || '') ? activeItems[0]?.size : `${activeItems[0]?.size} EUR`}</p>
                        </div>
                        {config.showPrice && (
                            <div>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Unit Value</p>
                                <p className="text-lg font-bold">¥ {activeItems[0]?.price.toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="bg-slate-900 text-white rounded-3xl p-10 flex justify-between items-end shadow-2xl">
                <div className="space-y-6 flex-1 pr-12">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Shipment Destination</p>
                        <p className="text-2xl font-bold">{order.customer.name}</p>
                        <p className="text-slate-400 text-sm">{order.customer.phone}</p>
                        {config.showAddress && <p className="text-slate-400 text-xs mt-2 leading-relaxed">{order.customer.address}</p>}
                    </div>
                    {config.showTracking && (
                        <div className="flex items-center gap-4 text-xs font-mono bg-white/5 border border-white/10 p-3 rounded-xl">
                            <span className="text-slate-500 uppercase">Tracking:</span>
                            <span>{order.shipping.company} {order.shipping.trackingNumber}</span>
                        </div>
                    )}
                </div>
                {config.showPrice && (
                    <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>Total Investment</p>
                        <p className="text-5xl font-black italic tracking-tighter">¥ {order.totalAmount.toLocaleString()}</p>
                    </div>
                )}
            </div>
        </div>
    )

    const renderSports = () => (
        <div className="relative z-10 w-full h-full bg-orange-500 flex flex-col p-16 font-sans overflow-hidden italic" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#f97316', color: primaryColor !== '#000000' ? primaryColor : undefined }}>
            <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_75%,transparent_75%,transparent)] bg-[size:100px_100px] opacity-20" />
            <div className="relative z-10 flex justify-between items-baseline text-white">
                <h1 className="text-8xl font-black tracking-tighter leading-none skew-x-[-12deg]">GO FAST</h1>
                <Logo className="invert scale-150 grayscale brightness-200" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-8">
                <div className="relative w-full">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] font-black text-white/10 select-none whitespace-nowrap">ACTIVE WEAR</div>
                    <div className="relative w-full aspect-square flex items-center justify-center">
                        {activeItems.map((item, idx) => (
                            item.image && (
                                <img
                                    key={idx}
                                    src={item.image}
                                    className="absolute w-full h-full object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.4)] transition-all duration-500"
                                    style={{ 
                                        transform: `scale(${imgScale * (1 - idx * 0.1)}) rotate(${shoeRotation + (idx * 12)}deg) translate(${shoeX + (idx * 40)}px, ${shoeY + (idx * 40)}px)`,
                                        zIndex: 10 - idx,
                                        opacity: idx === 0 ? 1 : 0.7
                                    }}
                                />
                            )
                        ))}
                    </div>
                </div>
                <div className="bg-black text-white p-12 w-full rounded-[4rem] flex flex-col gap-8 shadow-2xl -rotate-2" style={{ transform: `scale(${fontScale})` }}>
                    <div className="flex justify-between items-start gap-8">
                        <div className="flex-1">
                            <p className="text-orange-500 font-black text-xs uppercase tracking-widest mb-2" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>Official Gear</p>
                            {config.showShoeName && <h2 className="text-5xl font-black tracking-tight uppercase line-clamp-1">{displayShoeName}</h2>}
                        </div>
                        <div className="text-right">
                            <p className="text-orange-500 font-black text-xs uppercase tracking-widest mb-2" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>Athlete</p>
                            <p className="text-3xl font-black">{order.customer.name}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-8 border-t border-white/10 pt-8">
                        <div>
                            <p className="text-white/40 text-[10px] font-bold uppercase mb-1">Standard Size</p>
                            <p className="text-2xl font-black">{['clothes', 'pants'].includes(activeItems[0]?.category || '') ? activeItems[0]?.size : `${activeItems[0]?.size} EUR`}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-white/40 text-[10px] font-bold uppercase mb-1">Delivery Address</p>
                            {config.showAddress && <p className="text-sm font-bold line-clamp-2 leading-snug">{order.customer.address}</p>}
                        </div>
                    </div>
                    <div className="flex justify-between items-center bg-orange-500 p-8 rounded-[2.5rem] mt-4 shadow-xl" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                        {config.showPrice ? (
                            <div>
                                <p className="text-black/40 text-[10px] font-black uppercase mb-1">MSRP Value</p>
                                <p className="text-5xl text-black font-black tracking-tighter">¥ {order.totalAmount.toLocaleString()}</p>
                            </div>
                        ) : <div className="h-12" />}
                        {config.showTracking && (
                            <div className="text-right">
                                <p className="text-black/40 text-[10px] font-black uppercase mb-1">Logistics ID</p>
                                <p className="text-xl text-black font-black font-mono">{order.shipping.trackingNumber}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )

    const renderArt = () => (
        <div className="relative z-10 w-full h-full bg-[#1a1a1a] flex flex-col p-16 font-sans text-white" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#1a1a1a', color: primaryColor !== '#000000' ? primaryColor : undefined }}>
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="relative z-10 flex border-l-8 border-primary pl-8 mb-12" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                <div className="flex-1">
                    <h1 className="text-[120px] font-black leading-none tracking-tighter uppercase mb-4">ART<span className="text-primary" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>.</span></h1>
                    <p className="text-sm tracking-[0.5em] font-light text-slate-400 uppercase">Aesthetic Objects for Daily Life</p>
                </div>
                <div className="text-right pt-4">
                    <Logo className="invert scale-150 origin-right grayscale opacity-50" />
                </div>
            </div>
            <div className="flex-1 flex gap-12 relative overflow-hidden">
                <div className="w-2/3 relative">
                    <div className="absolute -top-12 -left-12 text-[200px] font-black text-white/5 pointer-events-none">SOLE</div>
                    <div className="relative w-full aspect-square">
                        {activeItems.map((item, idx) => (
                            item.image && (
                                <img
                                    key={idx}
                                    src={item.image}
                                    className="absolute w-full h-full object-contain filter contrast-125 saturate-125 transition-all duration-500"
                                    style={{ 
                                        transform: `scale(${imgScale * (1 - idx * 0.08)}) rotate(${shoeRotation + (idx * -8)}deg) translate(${shoeX + (idx * 30)}px, ${shoeY + (idx * 30)}px)`,
                                        zIndex: 10 - idx,
                                        opacity: idx === 0 ? 1 : 0.6
                                    }}
                                />
                            )
                        ))}
                    </div>
                    <div className="mt-12 space-y-4" style={{ transform: `scale(${fontScale})`, transformOrigin: 'top left' }}>
                        {config.showShoeName && <h2 className="text-4xl font-light tracking-tight text-white/90 border-b border-white/20 pb-4 italic">{displayShoeName}</h2>}
                        <div className="flex gap-12 text-[10px] tracking-widest uppercase font-bold text-slate-500">
                            <span>Collection 2024</span>
                            <span>Verified Authentic</span>
                            <span>Ref: {config.showOrderId ? order.id.slice(0, 8) : '****'}</span>
                        </div>
                    </div>
                </div>
                <div className="w-1/3 flex flex-col justify-between">
                    <div className="space-y-12">
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>Custodian</p>
                            <p className="text-2xl font-bold">{order.customer.name}</p>
                            {config.showAddress && <p className="text-xs text-slate-400 mt-2 font-light leading-relaxed">{order.customer.address}</p>}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>Specs</p>
                            <p className="text-xl font-medium tracking-widest italic">{['clothes', 'pants'].includes(activeItems[0]?.category || '') ? activeItems[0]?.size : `${activeItems[0]?.size} EUR`}</p>
                            {config.showTracking && <p className="text-[10px] font-mono text-slate-500 mt-4 leading-relaxed">{getTrackingDisplay()}</p>}
                        </div>
                    </div>
                    {config.showPrice && (
                        <div className="bg-primary p-8 rounded-none" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                            <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2">Object Value</p>
                            <p className="text-4xl text-black font-black tracking-tighter italic">¥ {order.totalAmount.toLocaleString()}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    const renderTech = () => (
        <div className="relative z-10 w-full h-full bg-blue-950 flex flex-col p-12 text-cyan-400 font-mono overflow-hidden" style={{
            backgroundColor: bgColor !== '#ffffff' ? bgColor : '#172554', color: primaryColor !== '#000000' ? primaryColor : undefined
        }}>
            <div className="absolute inset-0 bg-[#000d1a]" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : undefined }} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="relative z-10 flex justify-between items-start border-2 border-cyan-400/30 p-8 rounded-2xl bg-cyan-950/20 backdrop-blur-md" style={{ borderColor: primaryColor !== '#000000' ? `${primaryColor}4D` : undefined }}>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-cyan-400 animate-pulse rounded-full" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
                        <h1 className="text-2xl font-black uppercase tracking-widest">SOLE-OS v2.0</h1>
                    </div>
                    <div className="flex gap-6 text-[10px]">
                        <span className="opacity-50">STATUS: PROCESSING</span>
                        <span className="opacity-50">LOCATION: {order.shipping.company.toUpperCase()}</span>
                    </div>
                </div>
                <div className="text-right">
                    <Logo className="invert scale-150 origin-right brightness-150 opacity-80" />
                    <p className="text-[10px] mt-4 opacity-50">{format(new Date(order.createdAt), 'yyyy.MM.dd HH:mm:ss')}</p>
                </div>
            </div>

            <div className="flex-1 flex gap-8 my-8 relative">
                <div className="w-2/3 border-2 border-cyan-400/30 rounded-2xl p-8 bg-cyan-950/20 backdrop-blur-md relative overflow-hidden" style={{ borderColor: primaryColor !== '#000000' ? `${primaryColor}4D` : undefined }}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1),transparent_70%)]" style={{ backgroundImage: primaryColor !== '#000000' ? `radial-gradient(circle at center, ${primaryColor}1A, transparent 70%)` : undefined }} />
                    <div className="relative w-full h-full flex items-center justify-center">
                        {activeItems.map((item, idx) => (
                            item.image && (
                                <img
                                    key={idx}
                                    src={item.image}
                                    className="absolute w-[80%] h-[80%] object-contain relative z-10 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all duration-500"
                                    style={{ 
                                        transform: `scale(${imgScale * (1 - idx * 0.1)}) rotate(${shoeRotation + (idx * 5)}deg) translate(${shoeX + (idx * 20)}px, ${shoeY + (idx * 20)}px)`,
                                        zIndex: 10 - idx,
                                        opacity: idx === 0 ? 1 : 0.5
                                    }}
                                />
                            )
                        ))}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 bg-cyan-400/10 backdrop-blur-xl p-4 rounded-xl border border-cyan-400/20" style={{ borderColor: primaryColor !== '#000000' ? `${primaryColor}33` : undefined }}>
                        {config.showShoeName && <p className="text-xs font-bold truncate uppercase">{displayShoeName}</p>}
                    </div>
                </div>
                <div className="w-1/3 flex flex-col gap-8">
                    <div className="flex-1 border-2 border-cyan-400/30 rounded-2xl p-6 bg-cyan-950/20 backdrop-blur-md space-y-6" style={{ borderColor: primaryColor !== '#000000' ? `${primaryColor}4D` : undefined, transform: `scale(${fontScale})`, transformOrigin: 'top center' }}>
                        <div>
                            <p className="text-[10px] opacity-40 mb-2 font-black uppercase tracking-widest">User Profile</p>
                            <p className="text-lg font-bold text-white">{order.customer.name}</p>
                            <p className="text-xs opacity-60 truncate">{order.customer.phone}</p>
                            {config.showAddress && <p className="text-[10px] text-cyan-400/50 mt-4 leading-tight">{order.customer.address}</p>}
                        </div>
                        <div>
                            <p className="text-[10px] opacity-40 mb-2 font-black uppercase tracking-widest">Hardware Specs</p>
                            <p className="text-xl font-bold bg-cyan-400 text-blue-950 px-4 py-1 inline-block rounded-md" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>SIZE {activeItems[0]?.size}</p>
                        </div>
                    </div>
                    <div className="border-2 border-cyan-400/30 rounded-2xl p-6 bg-cyan-950/20 backdrop-blur-md" style={{ borderColor: primaryColor !== '#000000' ? `${primaryColor}4D` : undefined }}>
                        <p className="text-[10px] opacity-40 mb-2 font-black uppercase tracking-widest">Tx Hash</p>
                        <p className="text-xs font-mono break-all opacity-80">{config.showOrderId ? order.id.toUpperCase() : '****'}</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 border-2 border-cyan-400/30 p-10 rounded-2xl bg-cyan-400/90 text-blue-950 shadow-[0_0_50px_rgba(34,211,238,0.3)]" style={{ borderColor: primaryColor !== '#000000' ? `${primaryColor}4D` : undefined, backgroundColor: primaryColor !== '#000000' ? `${primaryColor}E6` : undefined }}>
                <div className="flex justify-between items-end">
                    <div className="space-y-6">
                        <div className="flex gap-8">
                            {config.showPrice && (
                                <div>
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Total Credits</p>
                                    <p className="text-4xl font-black italic tracking-tighter">¥ {order.totalAmount.toLocaleString()}</p>
                                </div>
                            )}
                            {config.showTracking && (
                                <div>
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Track Vector</p>
                                    <p className="text-xl font-black font-mono">{getTrackingDisplay()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-right opacity-40 font-black text-6xl italic leading-none select-none">CONFIRMED</div>
                </div>
            </div>
        </div>
    )

    const renderMagazine = () => (
        <div className="relative z-10 w-full h-full flex flex-col font-serif text-black overflow-hidden" style={{ backgroundColor: bgColor }}>
            <div className="flex justify-between items-end p-12 border-b-4 border-black" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                <div>
                    <h1 className="text-[120px] leading-none font-black tracking-tighter mix-blend-difference" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>SOLE</h1>
                    <p className="text-xl font-sans font-bold tracking-[0.5em] uppercase mt-2">Magazine Issue 01</p>
                </div>
                <div className="text-right space-y-2">
                    <p className="font-sans font-bold text-sm bg-black text-white px-2 py-1 inline-block" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>VOL. 24</p>
                    <p className="font-sans font-bold text-lg">{format(new Date(order.createdAt), 'MMM yyyy').toUpperCase()}</p>
                </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border border-black/5" />
                <div className="relative z-10 w-full px-12">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-black text-black/5 whitespace-nowrap pointer-events-none select-none">
                        {activeItems[0]?.size}
                    </div>
                    {activeItems[0]?.image && (
                        <img
                            src={activeItems[0].image}
                            className="w-full object-contain relative z-20 drop-shadow-2xl"
                            style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                        />
                    )}
                    {config.showShoeName && (
                        <h2
                            className="absolute bottom-12 left-12 right-12 text-6xl font-black uppercase text-center leading-tight mix-blend-multiply z-30"
                            style={{
                                color: primaryColor === '#000000' || !primaryColor ? 'black' : primaryColor,
                                fontSize: `${fontScale * 3.75}rem`
                            }}
                        >
                            {displayShoeName}
                        </h2>
                    )}
                </div>
            </div>

            <div className="p-12 border-t-4 border-black grid grid-cols-3 gap-8 font-sans" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                <div>
                    <p className="font-black uppercase text-xs mb-2">Model Spec</p>
                    <p className="text-2xl font-bold">{['clothes', 'pants'].includes(activeItems[0]?.category || '') ? activeItems[0]?.size : `${activeItems[0]?.size} EUR`}</p>
                </div>
                <div className="border-l border-black pl-8" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                    <p className="font-black uppercase text-xs mb-2">Recipient</p>
                    <p className="text-lg font-bold truncate">{order.customer.name}</p>
                    <p className="text-xs mt-1 text-gray-500">{order.customer.phone}</p>
                </div>
                {config.showPrice && (
                    <div className="border-l border-black pl-8 text-right" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                        <p className="font-black uppercase text-xs mb-2">Total</p>
                        <p className="text-4xl font-black italic">¥{order.totalAmount.toLocaleString()}</p>
                    </div>
                )}
            </div>
        </div>
    )

    const renderIndustrial = () => (
        <div className="relative z-10 w-full h-full bg-[#fbbf24] flex flex-col p-8 font-mono text-black overflow-hidden" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#fbbf24', color: textColor !== '#000000' ? textColor : undefined }}>
            <div className="border-4 border-black h-full relative flex flex-col p-8" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                <div className="absolute top-0 left-0 bg-black text-[#fbbf24] px-4 py-2 font-bold text-sm -translate-x-4 -translate-y-4 rotate-0 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                    CAUTION: FRAGILE CONTENTS
                </div>

                <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                    <div className="space-y-2">
                        <RenderBrand className="invert text-6xl" />
                        <h1 className="text-6xl font-black tracking-tighter">SPEC_SHEET</h1>
                        <p className="text-xs uppercase bg-black text-[#fbbf24] inline-block px-2" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>Ref: {config.showOrderId ? order.id.slice(0, 8).toUpperCase() : '****'}</p>
                    </div>
                    <div className="text-right">
                        <div className="w-24 h-24 border-2 border-black p-1 flex items-center justify-center" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                            <div className="w-full h-full bg-black text-[#fbbf24] flex items-center justify-center text-xs text-center font-bold p-1" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                                QR CODE
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative flex items-center justify-center border-4 border-black bg-white/10 my-4 pattern-grid-lg" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[size:20px_20px]" />
                    <div className="relative w-full h-full flex items-center justify-center">
                        {activeItems.map((item, idx) => (
                            item.image && (
                                <img
                                    key={idx}
                                    src={item.image}
                                    className="absolute w-[85%] h-[85%] object-contain drop-shadow-[10px_10px_0px_rgba(0,0,0,0.2)] grayscale contrast-125 transition-all duration-500"
                                    style={{ 
                                        transform: `scale(${imgScale * (1 - idx * 0.12)}) rotate(${shoeRotation + (idx * 15)}deg) translate(${shoeX + (idx * 40)}px, ${shoeY + (idx * 40)}px)`,
                                        zIndex: 10 - idx,
                                        opacity: idx === 0 ? 1 : 0.4
                                    }}
                                />
                            )
                        ))}
                    </div>
                    <div
                        className="absolute bottom-4 right-4 bg-black text-white px-6 py-2 font-bold text-xl -rotate-2"
                        style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : 'black' }}
                    >
                        SIZE: {activeItems[0]?.size}
                    </div>
                </div>

                <div className="mt-8 space-y-6">
                    {config.showShoeName && (
                        <h2
                            className="text-4xl font-black uppercase truncate border-b-2 border-black pb-2"
                            style={{ fontSize: `${fontScale * 2.25}rem`, borderColor: primaryColor !== '#000000' ? primaryColor : undefined, color: textColor }}
                        >
                            {displayShoeName}
                        </h2>
                    )}

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <div className="flex justify-between border-b border-black border-dashed" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                                <span>CUSTOMER</span>
                                <span className="font-bold">{order.customer.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-black border-dashed" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                                <span>CONTACT</span>
                                <span className="font-bold">{order.customer.phone}</span>
                            </div>
                            {config.showTracking && (
                                <div className="flex justify-between border-b border-black border-dashed" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                                    <span>TRACKING</span>
                                    <span className="font-bold truncate max-w-[150px]">{getTrackingDisplay()}</span>
                                </div>
                            )}
                        </div>
                        {config.showPrice && (
                            <div className="text-right">
                                <p className="text-xs font-bold mb-1">TOTAL VALUATION</p>
                                <p className="text-5xl font-black">¥{order.totalAmount.toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 right-0 w-32 h-32 bg-[repeating-linear-gradient(45deg,black,black_10px,transparent_10px,transparent_20px)] opacity-10 pointer-events-none" />
            </div>
        </div>
    )

    // Placeholder functions for styles not provided in the diff
    const renderVibrant = () => (
        <div className="relative z-10 w-full h-full bg-slate-900 flex flex-col p-12 overflow-hidden font-sans" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#0f172a', color: textColor }}>
            <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
            <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-blue-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex justify-between items-start mb-12">
                <div className="space-y-2">
                    <h1 className="text-6xl font-black italic tracking-tighter text-white uppercase leading-none">VIBRANT<span className="text-primary" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>.</span></h1>
                    <p className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase">Aura of Excellence</p>
                </div>
                <div className="text-right">
                    <Logo className="invert scale-125 origin-right opacity-80" />
                    <p className="text-[10px] font-mono text-white/30 mt-4">{format(new Date(order.createdAt), 'dd/MM/yyyy • HH:mm')}</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className="relative w-full aspect-square max-w-lg flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl scale-110 animate-pulse" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
                    {activeItems.map((item, idx) => (
                        item.image && (
                            <img
                                key={idx}
                                src={item.image}
                                className="absolute w-full h-full object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500"
                                style={{ 
                                    transform: `scale(${imgScale * (1 - idx * 0.1)}) rotate(${shoeRotation + (idx * 10)}deg) translate(${shoeX + (idx * 30)}px, ${shoeY + (idx * 30)}px)`,
                                    zIndex: 10 - idx,
                                    opacity: idx === 0 ? 1 : 0.6
                                }}
                            />
                        )
                    ))}
                </div>
                {config.showShoeName && (
                    <div className="mt-8 text-center" style={{ transform: `scale(${fontScale})` }}>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tight">{displayShoeName}</h2>
                        <div className="w-24 h-1 bg-primary mx-auto mt-4 rounded-full" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
                    </div>
                )}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-12 relative z-10">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Scale</p>
                            <p className="text-xl font-bold text-white">{activeItems[0]?.size} {!['clothes', 'pants'].includes(activeItems[0]?.category || '') && <span className="text-[10px] font-normal opacity-50">EUR</span>}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{isChinese ? '数量' : 'Qty'}</p>
                            <p className="text-xl font-bold text-white">x{activeItems[0]?.quantity}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/10 space-y-3">
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>{isChinese ? '收件信息' : 'Consignee'}</p>
                            <p className="text-lg font-bold text-white">{order.customer.name}</p>
                            <p className="text-xs text-white/60">{order.customer.phone}</p>
                        </div>
                        {config.showAddress && (
                            <p className="text-[10px] text-white/40 leading-relaxed border-t border-white/5 pt-3">{order.customer.address}</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                    {config.showTracking && (
                        <div className="text-right">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Track_ID</p>
                            <p className="text-sm font-bold text-white font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">{order.shipping.trackingNumber}</p>
                            <p className="text-[10px] text-primary/60 mt-1 uppercase font-bold" style={{ color: primaryColor !== '#000000' ? `${primaryColor}99` : undefined }}>{order.shipping.company}</p>
                        </div>
                    )}
                    <div className="text-right">
                        {config.showPrice && (
                            <>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{isChinese ? '交易总额' : 'Total Valuation'}</p>
                                <p className="text-5xl font-black text-white tracking-tighter" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>¥{order.totalAmount.toLocaleString()}</p>
                            </>
                        )}
                        <div className="mt-4 flex items-center gap-2 justify-end">
                            <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.5em]">{config.showOrderId ? order.id : '****'}</div>
                            <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-black italic shadow-lg shadow-white/10">S</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderElegant = () => (
        <div className="relative z-10 w-full h-full flex flex-col p-16 bg-[#fdfaf6] font-serif overflow-hidden" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#fdfaf6', color: textColor }}>
            <div className="flex-1 flex flex-col justify-between border-y border-[#d4cfc9] py-12" style={{ borderColor: textColor !== '#000000' ? `${textColor}40` : undefined }}>
                <div className="text-center space-y-6">
                    <RenderBrand className="scale-125 mb-12 opacity-80" />
                    <div style={{ transform: `scale(${fontScale})`, transformOrigin: 'center' }}>
                        {config.showShoeName && <h1 className="text-6xl font-light italic tracking-tight mb-4">{displayShoeName}</h1>}
                        <p className="text-xs uppercase tracking-[0.5em] opacity-40">The Art of Movement</p>
                    </div>
                </div>

                <div className="relative aspect-square max-w-lg mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#f3efea] to-transparent rounded-full opacity-50 blur-3xl scale-90" />
                <div className="relative aspect-square max-w-lg mx-auto flex items-center justify-center w-full">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#f3efea] to-transparent rounded-full opacity-50 blur-3xl scale-90" />
                    {activeItems.map((item, idx) => (
                        item.image && (
                            <img
                                key={idx}
                                src={item.image}
                                className="absolute w-full h-full object-contain relative z-10 drop-shadow-2xl transition-all duration-500"
                                style={{ 
                                    transform: `scale(${imgScale * (1 - idx * 0.15)}) rotate(${shoeRotation + (idx * -15)}deg) translate(${shoeX + (idx * -20)}px, ${shoeY + (idx * -20)}px)`,
                                    zIndex: 10 - idx,
                                    opacity: idx === 0 ? 1 : 0.5
                                }}
                            />
                        )
                    ))}
                </div>
                </div>

                <div className="grid grid-cols-3 gap-12 text-center" style={{ transform: `scale(${fontScale})`, transformOrigin: 'bottom center' }}>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest opacity-40">Size</p>
                        <p className="text-xl">{activeItems[0]?.size}{activeItems.length > 1 ? ` (+${activeItems.length - 1})` : ''}</p>
                    </div>
                    <div className="space-y-1 border-x border-[#d4cfc9]" style={{ borderColor: textColor !== '#000000' ? `${textColor}20` : undefined }}>
                        <p className="text-[10px] uppercase tracking-widest opacity-40">Release</p>
                        <p className="text-xl">{format(new Date(order.createdAt), 'yyyy')}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest opacity-40">Value</p>
                        <p className="text-xl">¥{order.totalAmount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="pt-8 flex justify-between items-center text-[10px] uppercase tracking-[0.3em] opacity-30">
                <span>{order.customer.name}</span>
                <span>{getTrackingDisplay()}</span>
                <span>{config.showOrderId ? order.id.slice(0, 8) : '****'}</span>
            </div>
        </div>
    )

    const renderComic = () => (
        <div className="relative z-10 w-full h-full bg-[#ffde00] p-10 flex flex-col font-black overflow-hidden" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#ffde00', color: textColor !== '#000000' ? textColor : 'black' }}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_2px,transparent_2px)] bg-[size:20px_20px]" />

            <div className="border-[6px] border-black h-full flex flex-col bg-white overflow-hidden shadow-[20px_20px_0px_#000] relative" style={{ borderColor: textColor !== '#000000' ? textColor : 'black' }}>
                <div className="bg-[#ff0000] border-b-[6px] border-black p-6 flex justify-between items-center" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : '#ff0000', borderColor: textColor !== '#000000' ? textColor : 'black' }}>
                    <RenderBrand className="scale-110" />
                    <div className="bg-white border-4 border-black px-4 py-1 rotate-3 shadow-[6px_6px_0px_#000]" style={{ borderColor: textColor !== '#000000' ? textColor : 'black' }}>
                        <span className="text-2xl uppercase italic">Order!</span>
                    </div>
                </div>

                <div className="flex-1 relative flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]">
                    <div className="absolute top-4 left-4 bg-black text-white px-4 py-1 skew-x-[-15deg] z-20" style={{ backgroundColor: textColor !== '#000000' ? textColor : 'black' }}>
                        NEW DROP!
                    </div>
                    <div className="relative w-full h-full flex items-center justify-center">
                        {activeItems.map((item, idx) => (
                            item.image && (
                                <img
                                    key={idx}
                                    src={item.image}
                                    className="absolute w-[80%] h-[80%] object-contain relative z-10 filter contrast-125 brightness-110 transition-all duration-500"
                                    style={{ 
                                        transform: `scale(${imgScale * (1 - idx * 0.12)}) rotate(${shoeRotation + (idx * -12)}deg) translate(${shoeX + (idx * -30)}px, ${shoeY + (idx * -30)}px)`,
                                        zIndex: 10 - idx,
                                        opacity: idx === 0 ? 1 : 0.7
                                    }}
                                />
                            )
                        ))}
                    </div>
                    <div className="absolute bottom-8 right-8 bg-[#00ff21] border-[6px] border-black p-6 rounded-full -rotate-12 shadow-[10px_10px_0px_#000] z-20 flex flex-col items-center" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : '#00ff21', borderColor: textColor !== '#000000' ? textColor : 'black' }}>
                        <span className="text-xs uppercase leading-none mb-1">Price</span>
                        <span className="text-4xl">¥{order.totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="border-t-[6px] border-black p-8 bg-[#3d00ff] text-white space-y-4" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : '#3d00ff', borderColor: textColor !== '#000000' ? textColor : 'black' }}>
                    {config.showShoeName && <h2 className="text-5xl uppercase italic tracking-tighter leading-none" style={{ fontSize: `${fontScale * 3}rem` }}>{displayShoeName}</h2>}
                    <div className="flex justify-between items-end border-t-4 border-black/20 pt-4">
                        <div className="text-xs uppercase space-y-1">
                            <p>Customer: {order.customer.name}</p>
                            <p>{getTrackingDisplay()}</p>
                        </div>
                        <div className="text-4xl italic">#{activeItems[0]?.size}{activeItems.length > 1 ? `+` : ''}</div>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderGrid = () => (
        <div className="relative z-10 w-full h-full bg-[#111] grid grid-cols-12 grid-rows-12 gap-[1px] bg-slate-800 border-[1px] border-slate-800 overflow-hidden" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#111', color: textColor !== '#000000' ? textColor : 'white' }}>
            <div className="col-span-8 row-span-2 bg-[#111] p-8 border-b border-r border-[#333] flex items-center" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#111', borderColor: textColor !== '#000000' ? `${textColor}20` : undefined }}>
                <RenderBrand />
            </div>
            <div className="col-span-4 row-span-2 bg-[#111] p-8 border-b border-[#333] flex flex-col justify-center text-right" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#111', borderColor: textColor !== '#000000' ? `${textColor}20` : undefined }}>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1" style={{ color: textColor !== '#000000' ? `${textColor}40` : undefined }}>Serial_No</p>
                <p className="font-mono text-xs">{config.showOrderId ? order.id.slice(0, 16).toUpperCase() : '****'}</p>
            </div>

            <div className="col-span-12 row-span-7 bg-[#000] relative overflow-hidden flex items-center justify-center border-b border-[#333]" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#000', borderColor: textColor !== '#000000' ? `${textColor}20` : undefined }}>
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="relative w-full h-full flex items-center justify-center">
                    {activeItems.map((item, idx) => (
                        item.image && (
                            <img
                                key={idx}
                                src={item.image}
                                className="absolute w-[80%] h-[80%] object-contain relative z-10 shadow-[0_0_100px_rgba(255,255,255,0.1)] transition-all duration-500"
                                style={{ 
                                    transform: `scale(${imgScale * (1 - idx * 0.1)}) rotate(${shoeRotation + (idx * 90)}deg) translate(${shoeX}px, ${shoeY}px)`,
                                    zIndex: 10 - idx,
                                    opacity: idx === 0 ? 1 : 0.4
                                }}
                            />
                        )
                    ))}
                </div>
                <div className="absolute top-8 right-8 writing-vertical-lr font-black text-6xl text-white/5 select-none" style={{ color: textColor !== '#000000' ? `${textColor}05` : undefined }}>AUTHENTIC</div>
            </div>

            <div className="col-span-5 row-span-3 bg-[#111] p-8 border-r border-[#333]" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#111', borderColor: textColor !== '#000000' ? `${textColor}20` : undefined }}>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2" style={{ color: textColor !== '#000000' ? `${textColor}40` : undefined }}>Model</p>
                {config.showShoeName && <h2 className="text-2xl font-black uppercase leading-tight line-clamp-3" style={{ fontSize: `${fontScale * 1.5}rem`, color: textColor }}>{displayShoeName}</h2>}
            </div>

            <div className="col-span-3 row-span-3 bg-[#111] p-8 border-r border-[#333] flex flex-col justify-between" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#111', borderColor: textColor !== '#000000' ? `${textColor}20` : undefined }}>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1" style={{ color: textColor !== '#000000' ? `${textColor}40` : undefined }}>Spec</p>
                    <p className="text-2xl font-bold">{activeItems[0]?.size}{activeItems.length > 1 ? `+` : ''} EU</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1" style={{ color: textColor !== '#000000' ? `${textColor}40` : undefined }}>Unit</p>
                    <p className="text-2xl font-bold">x{activeItems[0]?.quantity}</p>
                </div>
            </div>

            <div className="col-span-4 row-span-3 bg-primary p-8 flex flex-col justify-between" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                <p className="text-[10px] text-black/40 uppercase tracking-widest font-black">Valuation</p>
                <p className="text-4xl font-black text-black tracking-tighter self-end" style={{ color: textColor !== '#000000' ? textColor : 'black' }}>¥{order.totalAmount.toLocaleString()}</p>
            </div>
        </div>
    )
    const renderPolaroid = () => (
        <div className="relative z-10 w-full h-full bg-[#f8f9fa] flex flex-col p-10 font-sans shadow-inner" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#f8f9fa', color: textColor }}>
            <div className="flex-1 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-sm border border-slate-100 flex flex-col relative overflow-hidden">
                <div className="absolute top-4 right-4 z-20">
                    <div className="bg-red-600 text-white px-3 py-1 rounded-sm text-[10px] font-black rotate-12 shadow-lg tracking-widest uppercase">Original</div>
                </div>

                <div className="flex-1 bg-slate-50 relative overflow-hidden flex items-center justify-center border border-slate-100/50">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:10px_10px]" />
                    <div className="relative w-full h-full flex items-center justify-center">
                        {activeItems.map((item, idx) => (
                            item.image && (
                                <img
                                    key={idx}
                                    src={item.image}
                                    className="absolute w-full h-full object-contain filter sepia-[0.1] contrast-[1.05] transition-all duration-500"
                                    style={{ 
                                        transform: `scale(${imgScale * (1 - idx * 0.1)}) rotate(${shoeRotation + (idx * 5)}deg) translate(${shoeX + (idx * 20)}px, ${shoeY + (idx * 20)}px)`,
                                        zIndex: 10 - idx,
                                        opacity: idx === 0 ? 1 : 0.6
                                    }}
                                />
                            )
                        ))}
                    </div>
                </div>

                <div className="pt-8 pb-4 px-2 space-y-6">
                    <div className="flex justify-between items-start">
                        <div style={{ transform: `scale(${fontScale})`, transformOrigin: 'top left' }}>
                            {config.showShoeName && <h2 className="text-3xl font-black italic tracking-tighter text-slate-800 uppercase mix-blend-multiply">{displayShoeName}</h2>}
                            <div className="flex gap-4 mt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-0.5 rounded-sm">Size: {activeItems[0]?.size}{activeItems.length > 1 ? ` (+${activeItems.length - 1})` : ''}</p>
                                {config.showOrderId && <p className="text-[10px] font-mono text-slate-300">#{order.id.slice(0, 8)}</p>}
                            </div>
                        </div>
                        <div className="text-right">
                            <RenderBrand className="scale-75 origin-right opacity-20 grayscale" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                        <div className="space-y-3">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{isChinese ? '客户' : 'Customer'}</p>
                                <p className="text-lg font-bold text-slate-800">{order.customer.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{order.customer.phone}</p>
                            </div>
                            {config.showAddress && (
                                <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3 italic">{order.customer.address}</p>
                            )}
                        </div>
                        <div className="text-right space-y-3">
                            {config.showPrice && (
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{isChinese ? '总览' : 'Value'}</p>
                                    <p className="text-3xl font-black text-slate-900" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>¥{order.totalAmount.toLocaleString()}</p>
                                </div>
                            )}
                            {config.showTracking && (
                                <div className="pt-2">
                                    <p className="text-[11px] font-mono font-bold text-slate-600 tracking-tight">{getTrackingDisplay()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-auto px-2 flex justify-between items-center text-[10px] font-mono font-bold text-slate-300 uppercase tracking-[0.2em] border-t border-slate-50 pt-4">
                    <span>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                    <span>SF – Verified</span>
                </div>
            </div>
            <div className="h-16 flex items-center justify-center">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
        </div>
    )

    const renderMinimalDark = () => (
        <div className="relative z-10 w-full h-full bg-black text-white flex flex-col font-sans overflow-hidden" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#000000', color: textColor !== '#000000' ? textColor : 'white' }}>
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
            <div className="p-16 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="space-y-4">
                        <RenderBrand className="invert scale-150 origin-left" />
                        {config.showOrderId && <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">ID:{order.id.slice(0, 12).toUpperCase()}</p>}
                    </div>
                    <div className="text-right font-black italic text-4xl text-white/5 select-none leading-none">ORDER<br />POSTER</div>
                </div>

                <div className="relative flex flex-col items-center w-full min-h-[400px] justify-center">
                    <div className="absolute top-1/2 left-0 w-full h-32 bg-primary/5 -translate-y-1/2 blur-3xl rounded-full" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined, opacity: 0.1 }} />
                    <div className="relative w-full h-full flex items-center justify-center">
                        {activeItems.map((item, idx) => (
                            item.image && (
                                <img
                                    key={idx}
                                    src={item.image}
                                    className="absolute w-full max-w-xl object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] transition-all duration-500"
                                    style={{ 
                                        transform: `scale(${imgScale * (1 - idx * 0.1)}) rotate(${shoeRotation + (idx * -8)}deg) translate(${shoeX + (idx * 30)}px, ${shoeY + (idx * 30)}px)`,
                                        zIndex: 10 - idx,
                                        opacity: idx === 0 ? 1 : 0.5
                                    }}
                                />
                            )
                        ))}
                    </div>
                </div>

                <div className="space-y-8" style={{ transform: `scale(${fontScale})`, transformOrigin: 'bottom left' }}>
                    {config.showShoeName && (
                        <div className="space-y-2">
                            <h1 className="text-7xl font-black uppercase tracking-tighter leading-none">{displayShoeName}</h1>
                            <p className="text-xs font-bold tracking-[0.5em] text-white/30 uppercase pl-1">Limited Edition</p>
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-12 border-t border-white/5 pt-12">
                        <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Specifications</p>
                            <p className="text-2xl font-bold tracking-tight">EU {activeItems[0]?.size}{activeItems.length > 1 ? ` (+${activeItems.length - 1})` : ''}</p>
                            <p className="text-xs text-white/40 mt-1">Authentic Gear</p>
                        </div>
                        <div className="col-span-1">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Consignee</p>
                            <p className="text-lg font-bold leading-tight">{order.customer.name}</p>
                            <p className="text-[10px] text-white/40 mt-1 uppercase font-bold">{order.customer.phone}</p>
                            {config.showAddress && <p className="text-[10px] text-white/20 mt-2 truncate w-full">{order.customer.address}</p>}
                        </div>
                        {config.showTracking && (
                            <div>
                                <p className="text-[11px] font-mono font-bold break-all opacity-80">{getTrackingDisplay()}</p>
                            </div>
                        )}
                        {config.showPrice && (
                            <div className="text-right">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Total Value</p>
                                <p className="text-4xl font-black text-primary tracking-tighter" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>¥{order.totalAmount.toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-16 py-8 border-t border-white/5 flex justify-between items-center">
                <div className="flex gap-12 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    <span>{format(new Date(order.createdAt), 'yyyy.MM.dd')}</span>
                    <span>SF-SECURE_V2</span>
                </div>
                <div className="w-12 h-1 bg-white/10" />
            </div>
        </div>
    )

    const renderAura = () => (
        <div className="relative z-10 w-full h-full bg-[#fafafa] flex flex-col p-12 overflow-hidden font-sans" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#fafafa', color: textColor }}>
            <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
            <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

            <div className="relative z-10 flex justify-between items-start mb-16">
                <RenderBrand />
                <div className="text-right">
                    <p className="text-[10px] font-bold tracking-[0.4em] opacity-30 uppercase">Premium Authentics</p>
                    <p className="text-xs font-mono opacity-20 mt-1">#{config.showOrderId ? order.id.slice(0, 8) : '****'}</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className="absolute w-[120%] aspect-square bg-gradient-radial from-primary/5 to-transparent opacity-50 blur-2xl" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
                <div className="relative w-full h-full flex items-center justify-center">
                    {activeItems.map((item, idx) => (
                        item.image && (
                            <img
                                key={idx}
                                src={item.image}
                                className="absolute w-[90%] object-contain relative z-10 drop-shadow-[0_40px_100px_rgba(0,0,0,0.1)] transition-all duration-500"
                                style={{ 
                                    transform: `scale(${imgScale * (1 - idx * 0.12)}) rotate(${shoeRotation + (idx * 12)}deg) translate(${shoeX + (idx * 40)}px, ${shoeY + (idx * 40)}px)`,
                                    zIndex: 10 - idx,
                                    opacity: idx === 0 ? 1 : 0.6
                                }}
                            />
                        )
                    ))}
                </div>
                {config.showShoeName && (
                    <div className="mt-16 text-center" style={{ transform: `scale(${fontScale})` }}>
                        <h2 className="text-5xl font-extralight tracking-tighter opacity-90 italic uppercase">{displayShoeName}</h2>
                        <div className="w-12 h-[1px] bg-primary mx-auto mt-6 opacity-30" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
                    </div>
                )}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-12 border-t border-black/5 pt-12 pb-4">
                <div className="space-y-6">
                    <div className="flex gap-12">
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Scale</p>
                            <p className="text-xl font-light">{activeItems[0]?.size} EU</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Units</p>
                            <p className="text-xl font-light">x{activeItems[0]?.quantity}</p>
                        </div>
                    </div>
                    {config.showTracking && (
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Logistics</p>
                            <p className="text-xs font-medium opacity-60 leading-relaxed">{getTrackingDisplay()}</p>
                        </div>
                    )}
                </div>
                <div className="text-right flex flex-col justify-between">
                    {config.showPrice && (
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valuation</p>
                            <p className="text-5xl font-extralight tracking-tighter" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>¥{order.totalAmount.toLocaleString()}</p>
                        </div>
                    )}
                    <span className="text-[10px] font-bold tracking-[0.3em] opacity-20 uppercase mt-4">Verified by SF</span>
                </div>
            </div>
        </div>
    )

    const renderFlash = () => (
        <div className="relative z-10 w-full h-full bg-slate-950 flex flex-col p-10 overflow-hidden font-sans italic" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#020617', color: textColor !== '#000000' ? textColor : 'white' }}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
            <div className="absolute top-0 left-0 w-full h-2 bg-primary animate-pulse" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : '#ef4444' }} />

            <div className="relative z-10 flex justify-between items-center mb-10 bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                <RenderBrand />
                <div className="bg-primary px-4 py-2 skew-x-[-15deg]" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : '#ef4444' }}>
                    <span className="text-black font-black uppercase text-xl not-italic">CONFIRMED</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] font-black opacity-[0.03] select-none pointer-events-none italic whitespace-nowrap">FLASH DROP</div>
                {activeItems[0]?.image && (
                    <img
                        src={activeItems[0].image}
                        className="w-full object-contain relative z-10 drop-shadow-[0_20px_60px_rgba(239,68,68,0.3)] skew-y-[-5deg]"
                        style={{
                            transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)`,
                            filter: `drop-shadow(0 20px 60px ${primaryColor !== '#000000' ? primaryColor : '#ef4444'}4D)`
                        }}
                    />
                )}
            </div>

            <div className="mt-8 space-y-6">
                {config.showShoeName && (
                    <div className="bg-white text-black p-6 skew-x-[-10deg] shadow-[10px_10px_0px_rgba(239,68,68,0.5)]" style={{ transform: `scale(${fontScale}) skewX(-10deg)`, boxShadow: primaryColor !== '#000000' ? `10px 10px 0px ${primaryColor}80` : undefined }}>
                        <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">{displayShoeName}</h2>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white/5 p-4 border-l-4 border-primary" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : '#ef4444' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Customer</p>
                        <p className="text-lg font-bold uppercase">{order.customer.name}</p>
                    </div>
                    <div className="bg-white/5 p-4 border-l-4 border-primary" style={{ borderColor: primaryColor !== '#000000' ? primaryColor : '#ef4444' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Specifications</p>
                        <p className="text-lg font-bold uppercase">SIZE {activeItems[0]?.size}</p>
                    </div>
                    {config.showPrice && (
                        <div className="bg-primary text-black p-4 skew-x-[-5deg] text-right" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : '#ef4444' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total</p>
                            <p className="text-4xl font-black italic">¥{order.totalAmount.toLocaleString()}</p>
                        </div>
                    )}
                </div>

                {config.showTracking && (
                    <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.5em] flex justify-between items-center border-t border-white/5 pt-6 italic">
                        <span>LGS: {getTrackingDisplay()}</span>
                        <span>ID: {config.showOrderId ? order.id : '****'}</span>
                    </div>
                )}
            </div>
        </div>
    )

    const renderBlueprint = () => (
        <div className="relative z-10 w-full h-full bg-[#0047AB] flex flex-col p-12 overflow-hidden font-mono text-white" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#0047AB', color: textColor !== '#000000' ? textColor : 'white' }}>
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:30px_30px]" />
            <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.1)_150px,transparent_150px),linear-gradient(90deg,rgba(255,255,255,0.1)_150px,transparent_150px)] bg-[size:150px_150px]" />

            <div className="relative z-10 flex justify-between items-start border-b-2 border-white/30 pb-8 mb-8">
                <div className="space-y-4">
                    <RenderBrand className="scale-125" />
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter uppercase leading-none">TECH_SPEC_V2</h1>
                        <p className="text-[10px] mt-1 opacity-60">AUTHORIZED TECHNICAL DOCUMENTATION // ORDER_{config.showOrderId ? order.id.slice(0, 8) : '****'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold leading-tight">DATE_{format(new Date(order.createdAt), 'yyyy.MM.dd')}<br />MOD_SOLE_RECO_43</p>
                </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center border-2 border-white/20 bg-white/5 rounded-sm">
                <div className="absolute top-4 left-4 text-[10px] opacity-40 bg-white/10 px-2 py-1">COORD_SYS: CARTESIAN</div>
                <div className="absolute top-4 right-4 text-6xl font-black text-white/5 select-none">SF-BLUEPRINT</div>

                {activeItems[0]?.image && (
                    <div className="relative">
                        <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-8 h-[2px] bg-white opacity-40" />
                        <div className="absolute -right-12 top-1/2 -translate-y-1/2 w-8 h-[2px] bg-white opacity-40" />
                        <div className="absolute left-1/2 -top-12 -translate-x-1/2 w-[2px] h-8 bg-white opacity-40" />
                        <div className="absolute left-1/2 -bottom-12 -translate-x-1/2 w-[2px] h-8 bg-white opacity-40" />

                        <img
                            src={activeItems[0].image}
                            className="w-[85%] object-contain relative z-10 filter brightness-110 contrast-125 grayscale opacity-90 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                            style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                        />
                    </div>
                )}
                <div className="absolute bottom-4 right-4 text-[10px] opacity-40">SCALE: {Math.round(imgScale * 100)}% // MODE: TECHNICAL</div>
            </div>

            <div className="mt-8 grid grid-cols-12 gap-8 items-end" style={{ transform: `scale(${fontScale})`, transformOrigin: 'bottom left' }}>
                <div className="col-span-8 space-y-6">
                    {config.showShoeName && (
                        <div>
                            <p className="text-[10px] font-bold opacity-40 bg-white/10 inline-block px-2 mb-2">PRODUCT_NAME</p>
                            <h2 className="text-3xl font-bold uppercase tracking-tight truncate">{displayShoeName}</h2>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-8 border-t border-white/20 pt-6">
                        <div>
                            <p className="text-[10px] font-bold opacity-40 mb-1">CONSIGNEE_DATA</p>
                            <p className="text-lg font-bold">{order.customer.name}</p>
                            <p className="text-xs opacity-60 mt-1">{order.customer.phone}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold opacity-40 mb-1">LOGISTICS_PTR</p>
                            <p className="text-sm font-bold truncate">{config.showTracking ? getTrackingDisplay() : 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <div className="col-span-4 text-right space-y-4">
                    <div className="bg-white/10 p-6 border-l-4 border-white">
                        <p className="text-[10px] font-bold opacity-40 mb-1">VALUATION_USD</p>
                        <p className="text-4xl font-black">¥{order.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-end gap-1">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="w-2 h-4 border border-white/20" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

    const renderGlass = () => (
        <div className="relative z-10 w-full h-full bg-slate-50 flex flex-col p-12 overflow-hidden font-sans" style={{ backgroundColor: bgColor !== '#ffffff' ? bgColor : '#f8fafc', color: textColor }}>
            {/* Aesthetic Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[100px] rounded-full" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[80px] rounded-full" />

            <div className="relative z-10 flex justify-between items-center mb-12">
                <RenderBrand className="scale-110" />
                <div className="text-right">
                    <p className="text-[10px] font-bold tracking-[0.4em] opacity-40 uppercase">Aesthetic Edition</p>
                    <p className="text-[9px] font-mono opacity-20 mt-1">{format(new Date(order.createdAt), 'yyyy/MM/dd HH:mm')}</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-xl" />

                {activeItems[0]?.image && (
                    <div className="relative z-10 w-[85%] aspect-square flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl scale-90" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }} />
                        <img
                            src={activeItems[0].image}
                            className="w-full h-full object-contain relative z-10 drop-shadow-[0_30px_60px_rgba(0,0,0,0.12)]"
                            style={{ transform: `scale(${imgScale}) rotate(${shoeRotation}deg) translate(${shoeX}px, ${shoeY}px)` }}
                        />
                    </div>
                )}

                {config.showShoeName && (
                    <div className="relative z-10 mt-8 text-center px-8" style={{ transform: `scale(${fontScale})` }}>
                        <h2 className="text-4xl font-bold tracking-tight text-slate-800 uppercase leading-tight bg-clip-text">
                            {displayShoeName}
                        </h2>
                        <div className="flex items-center justify-center gap-3 mt-4">
                            <span className="h-[1px] w-8 bg-slate-300" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verified Quality</span>
                            <span className="h-[1px] w-8 bg-slate-300" />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6 relative z-10">
                <div className="bg-white/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/40 shadow-sm space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-200/50 pb-3">
                        <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ownership</p>
                            <p className="text-lg font-bold text-slate-800">{order.customer.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ref. ID</p>
                            <p className="text-[10px] font-mono font-bold text-slate-400">{config.showOrderId ? order.id.slice(0, 8).toUpperCase() : '****'}</p>
                        </div>
                    </div>
                    {config.showAddress && (
                        <p className="text-[9px] text-slate-400 leading-relaxed italic line-clamp-2">{order.customer.address}</p>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex-1 bg-white/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/40 shadow-sm flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Specifications</p>
                            <span className="text-[10px] font-bold text-primary" style={{ color: primaryColor !== '#000000' ? primaryColor : undefined }}>AUTHENTIC</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">EU {order.items[0]?.size}</p>
                    </div>

                    {config.showPrice && (
                        <div className="bg-primary p-6 rounded-[2rem] shadow-lg shadow-primary/20 flex flex-col justify-center" style={{ backgroundColor: primaryColor !== '#000000' ? primaryColor : undefined }}>
                            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Valuation</p>
                            <p className="text-3xl font-black text-white tracking-tighter italic">¥ {order.totalAmount.toLocaleString()}</p>
                        </div>
                    )}
                </div>
            </div>

            {config.showTracking && (
                <div className="mt-6 px-4 flex justify-between items-center text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] relative z-10">
                    <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        LGS: {getTrackingDisplay()}
                    </span>
                    <span>System: SoleFlow_OS_v3</span>
                </div>
            )}
        </div>
    )


    const styles: Record<string, () => React.ReactElement> = {
        classic: renderDefault,
        modern: renderModern,
        cyber: renderCyber,
        luxury: renderLuxury,
        minimalist: renderMinimalist,
        receipt: renderReceipt,
        street: renderStreet,
        retro: renderRetro,
        business: renderBusiness,
        sports: renderSports,
        art: renderArt,
        tech: renderTech,
        magazine: renderMagazine,
        industrial: renderIndustrial,
        nature: renderNature,
        typography: renderTypography,
        gradient: renderGradient,
        vibrant: renderVibrant,
        polaroid: renderPolaroid,
        minimalDark: renderMinimalDark,
        elegant: renderElegant,
        comic: renderComic,
        grid: renderGrid,
        ink: renderVibrant,
        neon: renderCyber,
        paper: renderMinimalist,
        aura: renderAura,
        flash: renderFlash,
        blueprint: renderBlueprint,
        glass: renderGlass
    }

    const renderContent = styles[style] || renderDefault


    return (
        <div ref={ref} data-poster-root className="relative shadow-2xl overflow-hidden shrink-0 bg-white" style={{ width: config.posterSize?.width || 800, height: config.posterSize?.height || 1000 }}>
            {renderContent()}
        </div>
    )
})

OrderPoster.displayName = 'OrderPoster'
