import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useOrderStore } from '@/store/useOrderStore'
import { format } from 'date-fns'
import { SIZE_MAPPING, COURIER_OPTIONS, CLOTHING_SIZE_MAPPING, PANTS_SIZE_MAPPING } from '@/types/order'
import type { OrderItem, ItemCategory, Order } from '@/types/order'
import { Button, GlassCard } from '@/components/ui/LayoutPrimitives'
import { Input, Label, Select } from '@/components/ui/FormPrimitives'
import { Upload, ArrowRight, ShoppingBag, Plus, Trash2, User as UserIcon, MapPin, Phone, Sparkles, TrendingUp, Mic, Loader2, CheckCircle2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfigStore } from '@/store/useConfigStore'
import { cn } from '@/lib/utils'
import { compressImage, fileToBase64 } from '@/lib/imageCompression'
import { RotateCcw, ChevronDown, ChevronUp, Copy as CopyIcon, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'
import { computeSmartRecognize, type SmartRecognizePreview } from '@/features/orders/utils/smartRecognize'

interface OrderFormProps {
    orderId?: string
}

export function OrderForm({ orderId }: OrderFormProps) {
    const { t, i18n } = useTranslation()
    const isChinese = i18n.language.startsWith('zh')
    const navigate = useNavigate()
    const location = useLocation()
    const { orders, addOrder, updateOrder } = useOrderStore()
    const { suppliers, imageCompressionEnabled, imageCompressionQuality } = useConfigStore()
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
    const [recognizePreview, setRecognizePreview] = useState<SmartRecognizePreview | null>(null)
    const [showAftersales, setShowAftersales] = useState(false)
    const [compressionProgress, setCompressionProgress] = useState<{ [key: number]: number }>({})
    const { supplierAftercare } = useConfigStore()

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

    const processFile = async (index: number, file: File) => {
        if (file && file.type.startsWith('image/')) {
            try {
                const originalSize = file.size
                let fileToProcess = file;
                
                // Reset and show progress for this index
                setCompressionProgress(prev => ({ ...prev, [index]: 0 }))
                
                if (imageCompressionEnabled) {
                    fileToProcess = await compressImage(file, {
                        maxSizeMB: 0.2,
                        maxWidthOrHeight: 800,
                        useWebWorker: true,
                        initialQuality: imageCompressionQuality,
                        onProgress: (progress) => {
                            setCompressionProgress(prev => ({ ...prev, [index]: progress }))
                        }
                    }) as File;
                }
                
                const compressedSize = fileToProcess.size
                const base64 = await fileToBase64(fileToProcess);
                const newItems = [...items]
                newItems[index] = { 
                    ...newItems[index], 
                    image: base64,
                    originalSize,
                    compressedSize
                }
                setItems(newItems)
                
                // Clear progress after completion
                setTimeout(() => {
                    setCompressionProgress(prev => {
                        const next = { ...prev }
                        delete next[index]
                        return next
                    })
                }, 500)
            } catch (error) {
                console.error('Error processing image:', error);
                toast.error(isChinese ? '图片处理失败' : 'Image processing failed');
                // Clear progress on error
                setCompressionProgress(prev => {
                    const next = { ...prev }
                    delete next[index]
                    return next
                })
            }
        } else {
            toast.error(isChinese ? '请上传图片文件' : 'Please upload an image file')
        }
    }

    const processFiles = async (files: FileList | File[]) => {
        const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))
        if (fileArray.length === 0) return

        toast.loading(isChinese ? '正在处理图片...' : 'Processing images...', { id: 'image-upload' })

        try {
            const newItems = [...items]
            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i]
                let fileToProcess = file
                
                // Track progress for each file being added (use index starting from items.length)
                const progressIndex = i === 0 && !items[0].image && items[0].name === '' 
                    ? 0 
                    : items.length + i
                
                setCompressionProgress(prev => ({ ...prev, [progressIndex]: 0 }))
                
                if (imageCompressionEnabled) {
                    fileToProcess = await compressImage(file, {
                        maxSizeMB: 0.2,
                        maxWidthOrHeight: 800,
                        useWebWorker: true,
                        initialQuality: imageCompressionQuality,
                        onProgress: (progress) => {
                            setCompressionProgress(prev => ({ ...prev, [progressIndex]: progress }))
                        }
                    }) as File
                }
                
                const base64 = await fileToBase64(fileToProcess)
                
                if (i === 0 && !items[0].image && items[0].name === '') {
                    // Fill first item if empty
                    newItems[0] = { ...newItems[0], image: base64 }
                } else {
                    // Add new item
                    newItems.push({
                        name: '', 
                        size: items[items.length - 1]?.size || '42', 
                        price: items[items.length - 1]?.price || 0, 
                        costPrice: items[items.length - 1]?.costPrice || 0, 
                        quantity: 1, 
                        image: base64, 
                        category: items[items.length - 1]?.category || 'shoes'
                    })
                }
                
                // Clear progress for this index
                setTimeout(() => {
                    setCompressionProgress(prev => {
                        const next = { ...prev }
                        delete next[progressIndex]
                        return next
                    })
                }, 500)
            }
            setItems(newItems)
            toast.success(isChinese ? `成功上传 ${fileArray.length} 张图片` : `Successfully uploaded ${fileArray.length} images`, { id: 'image-upload' })
        } catch (error) {
            console.error('Error processing images:', error)
            toast.error(isChinese ? '图片处理失败' : 'Image processing failed', { id: 'image-upload' })
            // Clear all progress on error
            setCompressionProgress({})
        }
    }

    const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            if (files.length > 1) {
                processFiles(files)
            } else {
                processFile(index, files[0])
            }
        }
    }

    const handlePaste = (index: number, e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile()
                    if (file) {
                        processFile(index, file)
                    }
                }
            }
        }
    }

    const handleDrop = (index: number, e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(null)
        const files = e.dataTransfer.files
        if (files) {
            if (files.length > 1) {
                processFiles(files)
            } else if (files.length === 1) {
                processFile(index, files[0])
            }
        }
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
        const preview = computeSmartRecognize(smartInput, suppliers, {
            recipient,
            items,
            shipping,
            supplier
        })
        if (!preview) return
        setRecognizePreview(preview)
    }

    const applyRecognizePreview = () => {
        if (!recognizePreview) return
        setRecipient(recognizePreview.recipient)
        setItems(recognizePreview.items)
        setShipping(recognizePreview.shipping)
        setSupplier(recognizePreview.supplier)
        setSmartInput('')
        setRecognizePreview(null)
        toast.success(
            recognizePreview.multiItemParsed
                ? (isChinese ? `已应用 ${recognizePreview.items.length} 个商品` : `Applied ${recognizePreview.items.length} items`)
                : (isChinese ? '识别结果已应用到表单' : 'Recognition applied to the form')
        )
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const createdAtDate = customCreatedAt ? new Date(customCreatedAt) : new Date()
        const safeCreatedAt = Number.isNaN(createdAtDate.getTime()) ? new Date() : createdAtDate

        const shippedAtDate = shippedAt ? new Date(shippedAt) : null
        const safeShippedAt = shippedAtDate && !Number.isNaN(shippedAtDate.getTime()) ? shippedAtDate.toISOString() : undefined

        const normalizedItems = (Array.isArray(items) ? items : []).map(item => ({
            ...item,
            name: String(item?.name || '').trim(),
            image: String(item?.image || ''),
            size: String(item?.size || '42'),
            price: Number(item?.price || 0),
            costPrice: Number(item?.costPrice || 0),
            quantity: Math.max(1, Number(item?.quantity || 1)),
            category: item?.category || 'shoes',
            isRefunded: !!item?.isRefunded,
            refundReason: item?.refundReason || '',
            returnCost: Number(item?.returnCost || 0),
            isExchanged: !!item?.isExchanged,
            exchangeReason: item?.exchangeReason || '',
            exchangeSize: item?.exchangeSize || '',
            exchangeCost: Number(item?.exchangeCost || 0),
            aftersalesCourierCompany: item?.aftersalesCourierCompany || '',
            aftersalesTrackingNumber: String(item?.aftersalesTrackingNumber || '').trim()
        })).filter(item => item.name)

        if (normalizedItems.length === 0) {
            toast.error(isChinese ? '请至少填写一个商品名称' : 'Please provide at least one item name')
            return
        }

        const orderData: Partial<Order> = {
            customer: recipient,
            remarks,
            supplier,
            items: normalizedItems,
            shipping: {
                ...shipping,
                trackingNumber: String(shipping.trackingNumber || '').trim()
            },
            shippedAt: safeShippedAt
        }

        if (orderId) {
            if (!existingOrder) {
                toast.error(isChinese ? '未找到订单，请返回列表重试' : 'Order not found, please retry from list')
                return
            }
            updateOrder(orderId, orderData)
            toast.success(isChinese ? '订单已更新' : 'Order updated')
        } else {
            addOrder({
                ...orderData,
                id: crypto.randomUUID(),
                createdAt: safeCreatedAt.toISOString(),
                updatedAt: new Date().toISOString()
            } as Order)
            toast.success(isChinese ? '订单已创建' : 'Order created')
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
                            placeholder={isChinese ? "粘贴文本后点「识别」，在预览中确认再写入表单..." : "Paste text, tap Recognize, confirm in preview..."}
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
                                {isChinese ? '识别并预览' : 'Recognize'}
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

                    <div className="space-y-4">
                        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                            <Label className="flex items-center gap-2">
                                <TrendingUp size={14} className="text-primary" />
                                {isChinese ? '供应商' : 'Supplier'}
                            </Label>
                            <Select value={supplier} onChange={e => { setSupplier(e.target.value); setShowAftersales(false); }}>
                                {suppliers.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </Select>
                        </div>

                        {supplier && (
                            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden transition-all">
                                <button
                                    type="button"
                                    onClick={() => setShowAftersales(!showAftersales)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={14} className="text-primary" />
                                        {isChinese ? '查看售后信息' : 'View After-sales Info'}
                                    </div>
                                    {showAftersales ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                
                                {showAftersales && (
                                    <div className="px-4 py-4 space-y-4 border-t border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isChinese ? '退货地址' : 'Return Address'}</p>
                                                <p className="text-sm whitespace-pre-wrap">{supplierAftercare[supplier]?.refundAddress || '—'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isChinese ? '售后联系' : 'Contact'}</p>
                                                <p className="text-sm">{supplierAftercare[supplier]?.refundContact || '—'}</p>
                                            </div>
                                            {supplierAftercare[supplier]?.refundNotes && (
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isChinese ? '备注' : 'Notes'}</p>
                                                    <p className="text-xs text-slate-500 italic">{supplierAftercare[supplier].refundNotes}</p>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="w-full h-9 rounded-xl gap-2 font-bold"
                                            onClick={() => {
                                                const care = supplierAftercare[supplier]
                                                const text = `${isChinese ? '退货地址' : 'Address'}: ${care?.refundAddress || ''}\n${isChinese ? '联系方式' : 'Contact'}: ${care?.refundContact || ''}\n${care?.refundNotes ? `${isChinese ? '备注' : 'Notes'}: ${care.refundNotes}` : ''}`
                                                navigator.clipboard.writeText(text)
                                                toast.success(isChinese ? '售后信息已复制' : 'After-sales info copied')
                                            }}
                                        >
                                            <CopyIcon size={14} /> {isChinese ? '复制售后信息' : 'Copy Info'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
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
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-200/50 dark:border-white/5 relative z-20">
                                <span className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <ShoppingBag size={14} className="text-primary" />
                                    {isChinese ? `商品款式 #${index + 1}` : `Item Style #${index + 1}`}
                                </span>
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    {/* Refund Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            const nextRefunded = !item.isRefunded
                                            handleItemChange(index, 'isRefunded', nextRefunded)
                                            if (nextRefunded) {
                                                handleItemChange(index, 'isExchanged', false)
                                            }
                                        }}
                                        className={cn(
                                            "h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-sm border text-xs font-bold transition-all",
                                            item.isRefunded
                                                ? "bg-red-500 text-white border-red-400 hover:bg-red-600"
                                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-red-300 hover:text-red-500"
                                        )}
                                        title={item.isRefunded ? t('orders.refunded') : t('orders.refund')}
                                    >
                                        {item.isRefunded ? <CheckCircle2 size={14} /> : <RotateCcw size={14} />}
                                        <span>{item.isRefunded ? t('orders.refunded') : t('orders.refund')}</span>
                                    </button>

                                    {/* Exchange Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            const nextExchanged = !item.isExchanged
                                            handleItemChange(index, 'isExchanged', nextExchanged)
                                            if (nextExchanged) {
                                                handleItemChange(index, 'isRefunded', false)
                                            }
                                        }}
                                        className={cn(
                                            "h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-sm border text-xs font-bold transition-all",
                                            item.isExchanged
                                                ? "bg-blue-500 text-white border-blue-400 hover:bg-blue-600"
                                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-300 hover:text-blue-500"
                                        )}
                                        title={item.isExchanged ? (isChinese ? '已换货' : 'Exchanged') : (isChinese ? '申请换货' : 'Exchange')}
                                    >
                                        {item.isExchanged ? <CheckCircle2 size={14} /> : <RefreshCw size={14} />}
                                        <span>{item.isExchanged ? (isChinese ? '已换货' : 'Exchanged') : (isChinese ? '换货' : 'Exchange')}</span>
                                    </button>

                                    {/* Delete Button */}
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleRemoveItem(index)
                                            }}
                                            className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                            title={isChinese ? '删除款式' : 'Delete style'}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-8 transition-opacity", item.isRefunded && "opacity-50 grayscale-[0.5]")}>
                                {/* Image Upload */}
                                <div className="lg:col-span-4 space-y-4">
                                    <div
                                        onClick={() => fileInputRefs.current[index]?.click()}
                                        onDragOver={(e) => handleDragOver(index, e)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(index, e)}
                                        onPaste={(e) => handlePaste(index, e)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                fileInputRefs.current[index]?.click();
                                            }
                                        }}
                                        tabIndex={0}
                                        className={cn(
                                            "aspect-[4/3] rounded-2xl border-2 border-dashed transition-all overflow-hidden relative group cursor-pointer flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/50",
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
                                            multiple
                                            onChange={e => handleImageUpload(index, e)}
                                        />
                                    </div>

                                    {/* Compression progress */}
                                    {compressionProgress[index] !== undefined && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                                <span>{isChinese ? '正在压缩...' : 'Compressing...'}</span>
                                                <span>{compressionProgress[index]}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary transition-all duration-200"
                                                    style={{ width: `${compressionProgress[index]}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {/* Image size info badge */}
                                    {item.image && imageCompressionEnabled && item.originalSize && item.compressedSize && (
                                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[10px] font-bold">
                                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <span className="text-slate-400 line-through">
                                                    {(item.originalSize / 1024).toFixed(1)} KB
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-600 mx-0.5">→</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                                                    {(item.compressedSize / 1024).toFixed(1)} KB
                                                </span>
                                            </span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-black">
                                                -{Math.round((1 - item.compressedSize / item.originalSize) * 100)}%
                                            </span>
                                        </div>
                                    )}
                                    {item.image && !imageCompressionEnabled && item.originalSize && (
                                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-400">
                                            <span>{isChinese ? '原始大小' : 'Original size'}</span>
                                            <span className="font-mono">{(item.originalSize / 1024).toFixed(1)} KB</span>
                                        </div>
                                    )}
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
                                    {item.isRefunded && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-red-500/20"
                                        >
                                            <div className="space-y-2">
                                                <Label className="text-red-500 flex items-center gap-2">
                                                    <RotateCcw size={14} />
                                                    {t('orders.refundReason')}
                                                </Label>
                                                <Select 
                                                    value={item.refundReason || ''} 
                                                    onChange={e => handleItemChange(index, 'refundReason', e.target.value)}
                                                    className="border-red-500/30 focus:ring-red-500/20"
                                                >
                                                    <option value="">{isChinese ? '-- 请选择退款原因 --' : '-- Select Reason --'}</option>
                                                    <option value="size_issue">{t('orders.refundReasons.size_issue')}</option>
                                                    <option value="quality_issue">{t('orders.refundReasons.quality_issue')}</option>
                                                    <option value="out_of_stock">{t('orders.refundReasons.out_of_stock')}</option>
                                                    <option value="customer_change">{t('orders.refundReasons.customer_change')}</option>
                                                    <option value="shipping_delay">{t('orders.refundReasons.shipping_delay')}</option>
                                                    <option value="other">{t('orders.refundReasons.other')}</option>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-red-500 flex items-center gap-2">
                                                    <RotateCcw size={14} />
                                                    {isChinese ? '退货成本 (¥)' : 'Return Cost (¥)'}
                                                </Label>
                                                <Input 
                                                    type="number"
                                                    value={item.returnCost || ''} 
                                                    onChange={e => handleItemChange(index, 'returnCost', e.target.value)}
                                                    className="border-red-500/30 focus:ring-red-500/20"
                                                    placeholder={isChinese ? '退货运费/损耗支出' : 'Shipping/damage costs'}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-red-500 flex items-center gap-2">
                                                    <Truck size={14} />
                                                    {isChinese ? '退回快递公司' : 'Return Courier'}
                                                </Label>
                                                <Select
                                                    value={item.aftersalesCourierCompany || ''}
                                                    onChange={e => handleItemChange(index, 'aftersalesCourierCompany', e.target.value)}
                                                    className="border-red-500/30 focus:ring-red-500/20"
                                                >
                                                    <option value="">{isChinese ? '-- 选择快递公司 --' : '-- Select Courier --'}</option>
                                                    {COURIER_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-red-500 flex items-center gap-2">
                                                    <Truck size={14} />
                                                    {isChinese ? '退回快递单号' : 'Return Tracking #'}
                                                </Label>
                                                <Input
                                                    type="text"
                                                    value={item.aftersalesTrackingNumber || ''}
                                                    onChange={e => handleItemChange(index, 'aftersalesTrackingNumber', e.target.value)}
                                                    className="border-red-500/30 focus:ring-red-500/20"
                                                    placeholder={isChinese ? '快递单号' : 'Tracking number'}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {item.isExchanged && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-blue-500/20"
                                        >
                                            <div className="space-y-2">
                                                <Label className="text-blue-500 flex items-center gap-2">
                                                    <RefreshCw size={14} />
                                                    {isChinese ? '换货原因' : 'Exchange Reason'}
                                                </Label>
                                                <Select 
                                                    value={item.exchangeReason || ''} 
                                                    onChange={e => handleItemChange(index, 'exchangeReason', e.target.value)}
                                                    className="border-blue-500/30 focus:ring-blue-500/20"
                                                >
                                                    <option value="">{isChinese ? '-- 请选择换货原因 --' : '-- Select Reason --'}</option>
                                                    <option value="size_issue">{isChinese ? '尺码不合' : 'Size Issue'}</option>
                                                    <option value="quality_issue">{isChinese ? '质量问题' : 'Quality Issue'}</option>
                                                    <option value="customer_change">{isChinese ? '客户改主意' : 'Customer Changed Mind'}</option>
                                                    <option value="shipping_delay">{isChinese ? '发货延迟' : 'Shipping Delay'}</option>
                                                    <option value="other">{isChinese ? '其他' : 'Other'}</option>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-blue-500 flex items-center gap-2">
                                                    <RefreshCw size={14} />
                                                    {isChinese ? '换货后尺码' : 'Exchanged Size'}
                                                </Label>
                                                <Select 
                                                    value={item.exchangeSize || item.size} 
                                                    onChange={e => handleItemChange(index, 'exchangeSize', e.target.value)}
                                                    className="border-blue-500/30 focus:ring-blue-500/20"
                                                >
                                                    {item.category === 'clothes' ? (
                                                        CLOTHING_SIZE_MAPPING.map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))
                                                    ) : item.category === 'pants' ? (
                                                        PANTS_SIZE_MAPPING.map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))
                                                    ) : (
                                                        SIZE_MAPPING.map(s => (
                                                            <option key={s.eur} value={s.eur}>
                                                                {isChinese ? `${s.eur}码` : `${s.eur} (US ${s.us})`}
                                                            </option>
                                                        ))
                                                    )}
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-blue-500 flex items-center gap-2">
                                                    <RefreshCw size={14} />
                                                    {isChinese ? '换货成本 (¥)' : 'Exchange Cost (¥)'}
                                                </Label>
                                                <Input 
                                                    type="number"
                                                    value={item.exchangeCost || ''} 
                                                    onChange={e => handleItemChange(index, 'exchangeCost', e.target.value)}
                                                    className="border-blue-500/30 focus:ring-blue-500/20"
                                                    placeholder={isChinese ? '来回运费等支出' : 'Shipping costs'}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-blue-500 flex items-center gap-2">
                                                    <Truck size={14} />
                                                    {isChinese ? '换货快递公司' : 'Exchange Courier'}
                                                </Label>
                                                <Select
                                                    value={item.aftersalesCourierCompany || ''}
                                                    onChange={e => handleItemChange(index, 'aftersalesCourierCompany', e.target.value)}
                                                    className="border-blue-500/30 focus:ring-blue-500/20"
                                                >
                                                    <option value="">{isChinese ? '-- 选择快递公司 --' : '-- Select Courier --'}</option>
                                                    {COURIER_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-blue-500 flex items-center gap-2">
                                                    <Truck size={14} />
                                                    {isChinese ? '换货快递单号' : 'Exchange Tracking #'}
                                                </Label>
                                                <Input
                                                    type="text"
                                                    value={item.aftersalesTrackingNumber || ''}
                                                    onChange={e => handleItemChange(index, 'aftersalesTrackingNumber', e.target.value)}
                                                    className="border-blue-500/30 focus:ring-blue-500/20"
                                                    placeholder={isChinese ? '快递单号' : 'Tracking number'}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
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

            <Modal
                isOpen={!!recognizePreview}
                onClose={() => setRecognizePreview(null)}
                title={isChinese ? '识别结果预览' : 'Recognition preview'}
                maxWidth="max-w-3xl"
            >
                {recognizePreview && (
                    <div className="space-y-6">
                        <p className="text-sm text-slate-500">
                            {isChinese ? '请核对并编辑以下信息，确认后将写入当前表单。' : 'Review and edit the parsed data. Confirm to apply it to the form.'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase">{isChinese ? '收件人' : 'Recipient'}</p>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">{isChinese ? '姓名' : 'Name'}</Label>
                                    <Input
                                        value={recognizePreview.recipient.name}
                                        onChange={(e) => setRecognizePreview({
                                            ...recognizePreview,
                                            recipient: { ...recognizePreview.recipient, name: e.target.value }
                                        })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">{isChinese ? '电话' : 'Phone'}</Label>
                                    <Input
                                        value={recognizePreview.recipient.phone}
                                        onChange={(e) => setRecognizePreview({
                                            ...recognizePreview,
                                            recipient: { ...recognizePreview.recipient, phone: e.target.value }
                                        })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">{isChinese ? '地址' : 'Address'}</Label>
                                    <textarea
                                        value={recognizePreview.recipient.address}
                                        onChange={(e) => setRecognizePreview({
                                            ...recognizePreview,
                                            recipient: { ...recognizePreview.recipient, address: e.target.value }
                                        })}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase">{isChinese ? '物流与供应商' : 'Shipping & supplier'}</p>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">{isChinese ? '快递' : 'Courier'}</Label>
                                    <Select
                                        value={recognizePreview.shipping.company}
                                        onChange={(e) => setRecognizePreview({
                                            ...recognizePreview,
                                            shipping: { ...recognizePreview.shipping, company: e.target.value }
                                        })}
                                        className="h-9"
                                    >
                                        {COURIER_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">{isChinese ? '单号' : 'Tracking'}</Label>
                                    <Input
                                        value={recognizePreview.shipping.trackingNumber}
                                        onChange={(e) => setRecognizePreview({
                                            ...recognizePreview,
                                            shipping: { ...recognizePreview.shipping, trackingNumber: e.target.value }
                                        })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">{isChinese ? '状态' : 'Status'}</Label>
                                    <Select
                                        value={recognizePreview.shipping.status}
                                        onChange={(e) => setRecognizePreview({
                                            ...recognizePreview,
                                            shipping: { ...recognizePreview.shipping, status: e.target.value }
                                        })}
                                        className="h-9"
                                    >
                                        <option value="pending">{t('status.pending')}</option>
                                        <option value="shipped">{t('status.shipped')}</option>
                                        <option value="delivered">{t('status.delivered')}</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">{isChinese ? '供应商' : 'Supplier'}</Label>
                                    <Select
                                        value={recognizePreview.supplier}
                                        onChange={(e) => setRecognizePreview({
                                            ...recognizePreview,
                                            supplier: e.target.value
                                        })}
                                        className="h-9"
                                    >
                                        {suppliers.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-xs font-bold text-slate-500 uppercase">
                                {isChinese ? `商品（${recognizePreview.items.length}）` : `Items (${recognizePreview.items.length})`}
                            </div>
                            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/10">
                                {recognizePreview.items.map((it, idx) => (
                                    <div key={idx} className="px-4 py-3 space-y-3">
                                        <div className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-12 sm:col-span-5 space-y-1">
                                                <Label className="text-xs text-slate-500">{isChinese ? '商品名称' : 'Name'}</Label>
                                                <Input
                                                    value={it.name}
                                                    onChange={(e) => {
                                                        const newItems = [...recognizePreview.items];
                                                        newItems[idx] = { ...it, name: e.target.value };
                                                        setRecognizePreview({ ...recognizePreview, items: newItems });
                                                    }}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="col-span-6 sm:col-span-2 space-y-1">
                                                <Label className="text-xs text-slate-500">{isChinese ? '尺码' : 'Size'}</Label>
                                                <Input
                                                    value={it.size}
                                                    onChange={(e) => {
                                                        const newItems = [...recognizePreview.items];
                                                        newItems[idx] = { ...it, size: e.target.value };
                                                        setRecognizePreview({ ...recognizePreview, items: newItems });
                                                    }}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="col-span-6 sm:col-span-2 space-y-1">
                                                <Label className="text-xs text-slate-500">{isChinese ? '数量' : 'Qty'}</Label>
                                                <Input
                                                    type="number"
                                                    value={it.quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...recognizePreview.items];
                                                        newItems[idx] = { ...it, quantity: parseInt(e.target.value) || 1 };
                                                        setRecognizePreview({ ...recognizePreview, items: newItems });
                                                    }}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="col-span-12 sm:col-span-3 space-y-1">
                                                <Label className="text-xs text-slate-500">{isChinese ? '价格' : 'Price'}</Label>
                                                <Input
                                                    type="number"
                                                    value={it.price}
                                                    onChange={(e) => {
                                                        const newItems = [...recognizePreview.items];
                                                        newItems[idx] = { ...it, price: parseFloat(e.target.value) || 0 };
                                                        setRecognizePreview({ ...recognizePreview, items: newItems });
                                                    }}
                                                    className="h-8"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newItems = recognizePreview.items.filter((_, i) => i !== idx);
                                                    setRecognizePreview({ ...recognizePreview, items: newItems });
                                                }}
                                                className="text-xs text-red-500 hover:text-red-600 font-medium"
                                            >
                                                {isChinese ? '删除' : 'Remove'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/30">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        const newItems: OrderItem[] = [...recognizePreview.items, {
                                            name: '',
                                            size: '42',
                                            price: 0,
                                            costPrice: 0,
                                            quantity: 1,
                                            image: '',
                                            category: 'shoes'
                                        }];
                                        setRecognizePreview({ ...recognizePreview, items: newItems });
                                    }}
                                    className="w-full justify-center rounded-xl h-9"
                                >
                                    <Plus size={16} className="mr-1" />
                                    {isChinese ? '添加商品' : 'Add item'}
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setRecognizePreview(null)}>
                                {isChinese ? '取消' : 'Cancel'}
                            </Button>
                            <Button type="button" className="rounded-xl px-8" onClick={applyRecognizePreview}>
                                {isChinese ? '确认写入表单' : 'Apply to form'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </form>
    )
}
