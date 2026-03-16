import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useOrderStore } from '@/store/useOrderStore'
import { format } from 'date-fns'
import { SIZE_MAPPING, COURIER_OPTIONS, CLOTHING_SIZE_MAPPING, PANTS_SIZE_MAPPING } from '@/types/order'
import type { OrderItem, ItemCategory } from '@/types/order'
import { Button, GlassCard } from '@/components/ui/LayoutPrimitives'
import { Input, Label, Select } from '@/components/ui/FormPrimitives'
import { Upload, ArrowRight, ShoppingBag, Plus, Trash2, User as UserIcon, MapPin, Phone, Sparkles, TrendingUp, Mic, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfigStore } from '@/store/useConfigStore'
import { cn } from '@/lib/utils'

interface OrderFormProps {
    orderId?: string
}

export function OrderForm({ orderId }: OrderFormProps) {
    const { t, i18n } = useTranslation()
    const isChinese = i18n.language.startsWith('zh')
    const navigate = useNavigate()
    const location = useLocation()
    const { orders, addOrder, updateOrder } = useOrderStore()
    const { suppliers } = useConfigStore()
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])
    const trackingInputRef = useRef<HTMLInputElement>(null)
    const [isListening, setIsListening] = useState(false)

    const existingOrder = orders.find(o => o.id === orderId)

    const [recipient, setRecipient] = useState({
        name: existingOrder?.customer.name || '',
        phone: existingOrder?.customer.phone || '',
        address: existingOrder?.customer.address || ''
    })
    const [remarks, setRemarks] = useState(existingOrder?.remarks || '')
    const [supplier, setSupplier] = useState(existingOrder?.supplier || suppliers[0] || '')

    const [items, setItems] = useState<OrderItem[]>(
        existingOrder?.items || [
            { name: '', size: '42', price: 0, costPrice: 0, quantity: 1, image: '', category: 'shoes' }
        ]
    )

    const [shipping, setShipping] = useState<any>({
        company: existingOrder?.shipping.company || 'ZTO',
        trackingNumber: existingOrder?.shipping.trackingNumber || '',
        status: existingOrder?.shipping.status || 'pending'
    })
    const [smartInput, setSmartInput] = useState('')
    const [customCreatedAt, setCustomCreatedAt] = useState(
        existingOrder?.createdAt ? format(new Date(existingOrder.createdAt), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm")
    )
    const [shippedAt, setShippedAt] = useState(
        existingOrder?.shippedAt ? format(new Date(existingOrder.shippedAt), "yyyy-MM-dd'T'HH:mm") : ''
    )
    const [isDragging, setIsDragging] = useState<number | null>(null)

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        if (params.get('focusTracking') === 'true' && trackingInputRef.current) {
            trackingInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
            setTimeout(() => {
                trackingInputRef.current?.focus()
            }, 500)
        }
    }, [location.search])

    const handleAddItem = () => {
        setItems([...items, { name: '', size: '42', price: 0, costPrice: 0, quantity: 1, image: '', category: 'shoes' }])
    }

    const handleRemoveItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index))
        }
    }

    const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const processFile = (index: number, file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onloadend = () => {
                handleItemChange(index, 'image', reader.result as string)
            }
            reader.readAsDataURL(file)
        } else {
            toast.error(isChinese ? '请上传图片文件' : 'Please upload an image file')
        }
    }

    const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(index, file)
    }

    const handleDrop = (index: number, e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(null)
        const file = e.dataTransfer.files?.[0]
        if (file) processFile(index, file)
    }

    const handleDragOver = (index: number, e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(index)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(null)
    }

    const handleVoiceRecognition = () => {
        if (!('webkitSpeechRecognition' in window)) {
            toast.error(isChinese ? '您的浏览器不支持语音识别' : 'Your browser does not support speech recognition')
            return
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.lang = isChinese ? 'zh-CN' : 'en-US'
        recognition.continuous = false
        recognition.interimResults = false

        recognition.onstart = () => {
            setIsListening(true)
        }

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript
            setSmartInput(prev => prev + transcript)
            setIsListening(false)
        }

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error)
            setIsListening(false)
            toast.error(isChinese ? '语音识别错误' : 'Speech recognition error')
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognition.start()
    }

    const handleSmartRecognize = () => {
        if (!smartInput.trim()) return

        // Simple regex-based recognition
        const phoneRegex = /(1[3-9]\d{9})/
        const phoneMatch = smartInput.match(phoneRegex)

        // Shoe size recognition (e.g., 42, 42.5, 42码, Size 42, EUR 42, US 9)
        // Look for numbers 30-50 (EUR) or 3-13 (US), optionally with .5
        const sizeRegex = /(?:size|eur|us|尺码|码)?\s*((?:3[0-9]|4[0-9]|50|[3-9]|1[0-3])(?:\.5)?)\s*(?:码|code|size|eur|us)?/i
        const sizeMatch = smartInput.match(sizeRegex)

        let recognizedSize = ''
        if (sizeMatch && sizeMatch[1]) {
            // Validate if it's a valid size in our mapping
            const cleanSize = sizeMatch[1]
            // Check if it matches a EUR size directly
            const eurMatch = SIZE_MAPPING.find(s => s.eur === cleanSize)
            // Check if it matches a US size
            const usMatch = SIZE_MAPPING.find(s => s.us === cleanSize)

            if (eurMatch) {
                recognizedSize = eurMatch.eur
            } else if (usMatch) {
                recognizedSize = usMatch.eur // Convert to EUR as internal standard
            }
        }

        // Split by common delimiters
        const parts = smartInput.split(/[\s,，、\n]+/)

        let name = ''
        let phone = phoneMatch ? phoneMatch[0] : ''
        let address = ''

        // Try to identify name (usually short, before phone or address, 2-4 chars, no digits/special chars)
        const namePart = parts.find(p => p.length >= 2 && p.length <= 4 && !/\d/.test(p) && !/size|eur|码|code/i.test(p))
        if (namePart) name = namePart

        // Infer address (rest of the text that isn't name, phone, or size)
        address = smartInput
            .replace(name, '')
            .replace(phone, '')
            .replace(sizeMatch ? sizeMatch[0] : '', '')
            .split(/[\s,，、\n]+/)
            .filter(p => p.length > 2)
            .join(' ')
            .trim()

        setRecipient({
            name: name || recipient.name,
            phone: phone || recipient.phone,
            address: address || recipient.address
        })

        if (recognizedSize && items.length > 0) {
            // Update the first item's size if recognized
            handleItemChange(0, 'size', recognizedSize)
        }

        setSmartInput('')
        toast.success(isChinese ? '识别成功' : 'Recognition successful')
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const orderData: any = {
            customer: recipient,
            remarks,
            supplier,
            items: items.map(item => ({
                ...item,
                price: Number(item.price),
                costPrice: Number(item.costPrice || 0),
                quantity: Number(item.quantity)
            })),
            shipping: {
                ...shipping,
                trackingNumber: shipping.trackingNumber.trim()
            },
            status: shipping.status,
            shippedAt: shippedAt ? new Date(shippedAt).toISOString() : undefined
        }

        // Logic for shippedAt handled by the field directly now

        if (orderId) {
            updateOrder(orderId, orderData)
        } else {
            addOrder({
                ...orderData,
                id: crypto.randomUUID(),
                createdAt: new Date(customCreatedAt).toISOString(),
                updatedAt: new Date().toISOString()
            } as any)
        }

        navigate('/orders')
    }

    const totalAmount = items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0)
    const totalCost = items.reduce((acc, item) => acc + (Number(item.costPrice || 0) * Number(item.quantity)), 0)
    const totalProfit = totalAmount - totalCost

    return (
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Smart Recognition */}
            {!orderId && (
                <GlassCard className="p-8 space-y-4 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={18} className="text-primary" />
                        <h2 className="text-lg font-bold text-primary">{t('newOrder.smartRecognition')}</h2>
                    </div>
                    <div className="flex gap-4 items-stretch">
                        <textarea
                            className="flex min-h-[80px] flex-1 rounded-2xl border border-primary/20 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all backdrop-blur-sm shadow-sm resize-none"
                            placeholder={isChinese ? "粘贴姓名、电话、地址，点击识别..." : "Paste name, phone, address and click recognize..."}
                            value={smartInput}
                            onChange={e => setSmartInput(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={handleVoiceRecognition}
                                variant="secondary"
                                className={cn(
                                    "px-4 h-full rounded-2xl transition-all",
                                    isListening && "animate-pulse border-primary text-primary"
                                )}
                            >
                                {isListening ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSmartRecognize}
                                className="h-full px-8 rounded-2xl font-bold shadow-lg shadow-primary/20"
                            >
                                {t('newOrder.recognize')}
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Customer Information */}
            <GlassCard className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                        {t('newOrder.customerInfo')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><UserIcon size={14} className="text-primary" /> {t('newOrder.recipientName')}</Label>
                            <Input
                                required
                                value={recipient.name}
                                onChange={e => setRecipient({ ...recipient, name: e.target.value })}
                                placeholder={t('newOrder.placeholderName')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Phone size={14} className="text-primary" /> {t('newOrder.phone')}</Label>
                            <Input
                                required
                                type="tel"
                                value={recipient.phone}
                                onChange={e => setRecipient({ ...recipient, phone: e.target.value })}
                                placeholder={t('newOrder.placeholderPhone')}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {t('newOrder.address')}</Label>
                        <textarea
                            className="flex min-h-[120px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all backdrop-blur-sm shadow-sm resize-none"
                            required
                            placeholder={t('newOrder.placeholderAddress')}
                            value={recipient.address}
                            onChange={e => setRecipient({ ...recipient, address: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                        <Label className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-primary" />
                            {isChinese ? '供应商' : 'Supplier'}
                        </Label>
                        <Select value={supplier} onChange={e => setSupplier(e.target.value)}>
                            {suppliers.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                        <Label className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-primary" />
                            {isChinese ? '订单备注' : 'Order Remarks'}
                        </Label>
                        <textarea
                            className="flex min-h-[100px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all backdrop-blur-sm shadow-sm resize-none"
                            placeholder={isChinese ? '添加备注信息...' : 'Add remarks...'}
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>
                </div>
            </GlassCard>

            {/* Order Items */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ShoppingBag className="text-primary" size={24} />
                        {t('newOrder.itemDetails')} ({items.length})
                    </h2>
                    <Button type="button" variant="secondary" onClick={handleAddItem} className="gap-2 rounded-xl">
                        <Plus size={18} /> {isChinese ? '添加商品' : 'Add Item'}
                    </Button>
                </div>

                <div className="space-y-6">
                    {items.map((item, index) => (
                        <GlassCard key={index} className="p-6 relative group border-white/40 dark:border-white/10">
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Image Upload */}
                                <div className="lg:col-span-4 space-y-4">
                                    <div
                                        onClick={() => fileInputRefs.current[index]?.click()}
                                        onDragOver={(e) => handleDragOver(index, e)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(index, e)}
                                        className={cn(
                                            "aspect-[4/3] rounded-2xl border-2 border-dashed transition-all overflow-hidden relative group cursor-pointer flex flex-col items-center justify-center",
                                            isDragging === index
                                                ? "border-primary bg-primary/5 scale-[0.98] shadow-inner"
                                                : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:border-primary/50"
                                        )}
                                    >
                                        {item.image ? (
                                            <div className="relative w-full h-full group/image">
                                                <img src={item.image} alt="Shoe" className="w-full h-full object-contain p-2" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-3 scale-105 group-hover/image:scale-100 transition-transform">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        className="rounded-full w-10 h-10 p-0 bg-white/20 backdrop-blur-md border-white/30 hover:bg-white/40 text-white"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            fileInputRefs.current[index]?.click()
                                                        }}
                                                    >
                                                        <Plus size={20} />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        className="rounded-full w-10 h-10 p-0 bg-red-500/20 backdrop-blur-md border-red-500/30 hover:bg-red-500/40 text-red-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleItemChange(index, 'image', '')
                                                        }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-4 text-slate-400 group-hover:text-primary transition-colors">
                                                <Upload size={24} className="mx-auto mb-2 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                                <p className="text-xs font-bold">{isChinese ? '点击或拖拽上传图片' : 'Click or drag to upload'}</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={el => { fileInputRefs.current[index] = el }}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={e => handleImageUpload(index, e)}
                                        />
                                    </div>
                                </div>

                                {/* Item Details */}
                                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2 space-y-2">
                                        <Label>{t('newOrder.shoeName')}</Label>
                                        <div className="flex gap-2">
                                            <Select
                                                value={item.category || 'shoes'}
                                                onChange={e => {
                                                    const newCategory = e.target.value as ItemCategory;
                                                    let defaultSize = '42';
                                                    if (newCategory === 'clothes') defaultSize = 'L';
                                                    if (newCategory === 'pants') defaultSize = '32';

                                                    const newItems = [...items];
                                                    newItems[index] = { ...newItems[index], category: newCategory, size: defaultSize };
                                                    setItems(newItems);
                                                }}
                                                className="w-1/3"
                                            >
                                                <option value="shoes">{isChinese ? '鞋子' : 'Shoes'}</option>
                                                <option value="clothes">{isChinese ? '衣服' : 'Clothes'}</option>
                                                <option value="pants">{isChinese ? '裤子' : 'Pants'}</option>
                                            </Select>
                                            <Input
                                                required
                                                value={item.name}
                                                onChange={e => handleItemChange(index, 'name', e.target.value)}
                                                placeholder={t('newOrder.placeholderShoe')}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('newOrder.size')}</Label>
                                        <Select value={item.size} onChange={e => handleItemChange(index, 'size', e.target.value)}>
                                            {(!item.category || item.category === 'shoes') && SIZE_MAPPING.map(s => (
                                                <option key={s.eur} value={s.eur}>
                                                    {isChinese ? `${s.eur} 码` : `US ${s.us}`}
                                                </option>
                                            ))}
                                            {item.category === 'clothes' && CLOTHING_SIZE_MAPPING.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                            {item.category === 'pants' && PANTS_SIZE_MAPPING.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div className="flex flex-col justify-end pb-0.5 sm:col-span-1">
                                        <div className="flex items-center justify-between h-12">
                                            <Label className="mb-0">{t('newOrder.quantity')}</Label>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    type="button"
                                                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200"
                                                    onClick={() => handleItemChange(index, 'quantity', Math.max(1, Number(item.quantity) - 1))}
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-bold">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200"
                                                    onClick={() => handleItemChange(index, 'quantity', Number(item.quantity) + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('newOrder.costPrice')}</Label>
                                        <Input
                                            type="number"
                                            required
                                            value={item.costPrice}
                                            onChange={e => handleItemChange(index, 'costPrice', e.target.value)}
                                            placeholder={t('newOrder.placeholderCost')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('newOrder.price')}</Label>
                                        <Input
                                            type="number"
                                            required
                                            value={item.price}
                                            onChange={e => handleItemChange(index, 'price', e.target.value)}
                                            placeholder={t('newOrder.placeholderPrice')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Shipping & Footer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <GlassCard className="lg:col-span-8 p-8 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ArrowRight className="text-primary rotate-45" size={20} />
                        {t('newOrder.shippingDetails')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>{t('newOrder.courier')}</Label>
                            <Select value={shipping.company} onChange={e => setShipping({ ...shipping, company: e.target.value })}>
                                {COURIER_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('newOrder.tracking')}</Label>
                            <Input
                                ref={trackingInputRef}
                                value={shipping.trackingNumber}
                                onChange={e => {
                                    const val = e.target.value
                                    setShipping((prev: any) => ({
                                        ...prev,
                                        trackingNumber: val,
                                        status: (val && prev.status === 'pending') ? 'shipped' : prev.status
                                    }))
                                    if (val && !shippedAt) {
                                        setShippedAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
                                    }
                                }}
                                placeholder={t('newOrder.placeholderTracking')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{isChinese ? '物流状态' : 'Shipping Status'}</Label>
                            <Select value={shipping.status} onChange={e => setShipping({ ...shipping, status: e.target.value })}>
                                <option value="pending">{t('status.pending')}</option>
                                <option value="shipped">{t('status.shipped')}</option>
                                <option value="delivered">{t('status.delivered')}</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{isChinese ? '发货时间' : 'Shipping Time'}</Label>
                            <Input
                                type="datetime-local"
                                value={shippedAt}
                                onChange={e => setShippedAt(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{isChinese ? '订单时间' : 'Order Time'}</Label>
                            <Input
                                type="datetime-local"
                                value={customCreatedAt}
                                onChange={e => setCustomCreatedAt(e.target.value)}
                            />
                        </div>
                    </div>
                </GlassCard>

                <div className="lg:col-span-4 space-y-6">
                    <GlassCard className="p-6 bg-primary/5 border-primary/20 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                <span>{isChinese ? '预计销售额' : 'Sales'}</span>
                                <span className="text-slate-900 dark:text-white">¥ {totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                <span>{isChinese ? '预计总成本' : 'Cost'}</span>
                                <span className="text-slate-900 dark:text-white">¥ {totalCost.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-primary/10 my-2" />
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-primary">
                                    <TrendingUp size={14} />
                                    <span className="text-sm font-bold">{isChinese ? '预计利润' : 'Profit'}</span>
                                </div>
                                <span className="text-2xl font-black text-primary">¥ {totalProfit.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-primary/5 pt-2">
                            <span>{items.length} {isChinese ? '款商品' : 'items'}</span>
                            <span>{items.reduce((acc, i) => acc + Number(i.quantity), 0)} {isChinese ? '双' : 'pairs'}</span>
                        </div>
                    </GlassCard>

                    <div className="flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => navigate('/orders')} className="flex-1 rounded-2xl h-14">{t('newOrder.cancel')}</Button>
                        <Button type="submit" size="lg" className="flex-[2] h-14 gap-2 rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
                            {existingOrder ? (isChinese ? '修改订单' : 'Update Order') : t('newOrder.submit')} <ArrowRight size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    )
}
