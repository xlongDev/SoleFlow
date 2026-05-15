import { SIZE_MAPPING, COURIER_OPTIONS } from '@/types/order'
import type { OrderItem } from '@/types/order'

export type SmartRecognizePreview = {
    recipient: { name: string; phone: string; address: string }
    items: OrderItem[]
    shipping: { company: string; trackingNumber: string; status: string }
    supplier: string
    multiItemParsed: boolean
}

type BaseContext = {
    recipient: { name: string; phone: string; address: string }
    items: OrderItem[]
    shipping: { company: string; trackingNumber: string; status: string }
    supplier: string
}

export function computeSmartRecognize(
    rawInput: string,
    supplierNames: string[],
    base: BaseContext
): SmartRecognizePreview | null {
    const normalized = rawInput.replace(/\r\n/g, '\n').trim()
    if (!normalized) return null

    const lines = normalized.split('\n').map(line => line.trim()).filter(Boolean)
    const words = normalized.split(/[\s,，、|]+/).map(word => word.trim()).filter(Boolean)
    const lowerText = normalized.toLowerCase()

    const phoneMatch = normalized.match(/1[3-9]\d{9}/)
    const phoneStr = phoneMatch?.[0] || ''
    // Ensure tracking number doesn't match the phone number
    const trackingMatch = normalized.match(/\b(?:[A-Z]{2}\d{8,20}|\d{10,20})\b/)
    const trackingStr = (trackingMatch?.[0] === phoneStr) ? '' : (trackingMatch?.[0] || '')
    const courierMatch = COURIER_OPTIONS.find(opt =>
        opt.label && lowerText.includes(opt.label.toLowerCase())
    )
    const quantityMatch = normalized.match(/(?:数量|qty|quantity|件数)\s*[:：]?\s*(\d{1,3})/i)
    const priceMatch = normalized.match(/(?:售价|价格|price)\s*[:：]?\s*(\d+(?:\.\d+)?)/i)
    const costMatch = normalized.match(/(?:拿货价|成本|cost)\s*[:：]?\s*(\d+(?:\.\d+)?)/i)
    const supplierMatch = supplierNames.find(s => lowerText.includes(s.toLowerCase()))

    const sizeMatch = normalized.match(/(?:size|eur|us|尺码|码)?\s*[:：]?\s*((?:3[0-9]|4[0-9]|50|[3-9]|1[0-3])(?:\.5)?)(?:\s*码)?/i)
    let recognizedSize = ''
    if (sizeMatch?.[1]) {
        const cleanSize = sizeMatch[1]
        const eurMatch = SIZE_MAPPING.find(s => s.eur === cleanSize)
        const usMatch = SIZE_MAPPING.find(s => s.us === cleanSize)
        recognizedSize = eurMatch?.eur || usMatch?.eur || ''
    }

    const nameLine = lines.find(line =>
        line.length >= 2 &&
        line.length <= 8 &&
        !/\d/.test(line) &&
        !/(地址|快递|物流|size|码|price|cost|收件)/i.test(line)
    ) || words.find(word =>
        word.length >= 2 &&
        word.length <= 4 &&
        !/\d/.test(word) &&
        !/(size|eur|码|price|cost)/i.test(word)
    ) || ''

    const addressLine = lines.find(line =>
        /(省|市|区|县|路|街|号|栋|室|镇|乡|村|address|收件地址)/i.test(line)
    ) || lines.find(line => line.length > 10 && /\d/.test(line) && !line.includes('http')) || ''

    const productName = lines.find(line =>
        /(款式|鞋|衣|裤|型号|style|product|name|品名)/i.test(line)
    )?.replace(/.*[:：]/, '').trim() || words.find(word =>
        word.length >= 2 &&
        word.length <= 24 &&
        !/\d{6,}/.test(word) &&
        !/(地址|电话|收件|快递|物流|size|eur|us|price|cost|数量|省|市|区|县|路|街|号|栋|室|镇|乡|村)/i.test(word)
    ) || ''

    const parseSize = (raw: string) => {
        const cleaned = raw.replace(/码|eur|us|size/ig, '').trim()
        const eurMatch = SIZE_MAPPING.find(s => s.eur === cleaned)
        const usMatch = SIZE_MAPPING.find(s => s.us === cleaned)
        return eurMatch?.eur || usMatch?.eur || cleaned
    }

    const parseItemLine = (line: string): OrderItem | null => {
        const compact = line.replace(/\s+/g, ' ').trim()
        if (!compact) return null
        const lineParts = compact.split(/[|，,]/).map(p => p.trim()).filter(Boolean)
        const source = lineParts.length > 1 ? lineParts : compact.split(/\s+/).filter(Boolean)
        const numericTokens = source.filter(part => /\d/.test(part))
        if (numericTokens.length < 2) return null

        const sizeToken = source.find(part => /^(?:\d{2}(?:\.5)?|XS|S|M|L|XL|XXL|XXXL|2XL|3XL)$/i.test(part.replace(/码/ig, '')))
        const qtyToken = source.find(part => /^(?:x|X|\*)?\d{1,3}$/.test(part))
        const priceToken = source.find(part => /^(?:¥|￥)?\d{2,5}(?:\.\d{1,2})?$/.test(part))
        const priceIdx = priceToken ? source.indexOf(priceToken) : -1
        const costToken = source.find((part, index) =>
            priceIdx >= 0 &&
            index > priceIdx &&
            /^(?:¥|￥)?\d{2,5}(?:\.\d{1,2})?$/.test(part)
        )

        const nameToken = source
            .filter(part => ![sizeToken, qtyToken, priceToken, costToken].includes(part))
            .join(' ')
            .replace(/^(商品|款式|品名)[:：]?\s*/i, '')
            .trim()

        if (!nameToken || !priceToken) return null

        const parsedPrice = Number(String(priceToken).replace(/[¥￥]/g, ''))
        const parsedCost = costToken ? Number(String(costToken).replace(/[¥￥]/g, '')) : 0
        const parsedQty = qtyToken ? Number(String(qtyToken).replace(/[xX*]/g, '')) : 1
        const parsedSize = sizeToken ? parseSize(String(sizeToken)) : (recognizedSize || '42')

        return {
            name: nameToken,
            size: parsedSize,
            quantity: Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1,
            price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
            costPrice: Number.isFinite(parsedCost) ? parsedCost : 0,
            image: '',
            category: /(衣|上衣|短袖|卫衣|jacket|shirt)/i.test(nameToken)
                ? 'clothes'
                : /(裤|牛仔|短裤|pants|jeans)/i.test(nameToken)
                    ? 'pants'
                    : 'shoes'
        }
    }

    const parsedRows = lines
        .map(parseItemLine)
        .filter((item): item is OrderItem => !!item)

    let nextItems: OrderItem[]
    let multiItemParsed = false
    if (parsedRows.length > 0) {
        nextItems = parsedRows
        multiItemParsed = parsedRows.length > 1
    } else {
        const first = base.items[0] || {
            name: '', size: '42', price: 0, costPrice: 0, quantity: 1, image: '', category: 'shoes' as const
        }
        nextItems = [
            {
                ...first,
                name: productName || first.name,
                size: recognizedSize || first.size,
                quantity: quantityMatch?.[1] ? Number(quantityMatch[1]) : first.quantity,
                price: priceMatch?.[1] ? Number(priceMatch[1]) : first.price,
                costPrice: costMatch?.[1] ? Number(costMatch[1]) : first.costPrice
            },
            ...base.items.slice(1)
        ]
    }

    let nextShipping = { ...base.shipping }
    if (courierMatch || trackingStr) {
        nextShipping = {
            ...nextShipping,
            company: courierMatch?.value || nextShipping.company,
            trackingNumber: trackingStr || nextShipping.trackingNumber,
            status: trackingStr ? 'shipped' : nextShipping.status
        }
    }

    return {
        recipient: {
            name: nameLine || base.recipient.name,
            phone: phoneStr || base.recipient.phone,
            address: addressLine || base.recipient.address
        },
        items: nextItems,
        shipping: nextShipping,
        supplier: supplierMatch || base.supplier,
        multiItemParsed
    }
}
