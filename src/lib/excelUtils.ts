import ExcelJS from 'exceljs';
import type { Order, OrderItem } from '@/types/order';
import { format } from 'date-fns';

// Helper to convert ArrayBuffer to Base64 in browser
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Helper to fetch image as buffer
const fetchImage = async (url: string): Promise<ArrayBuffer | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.arrayBuffer();
    } catch (error) {
        console.error('Error fetching image:', error);
        return null;
    }
};

export const exportToExcel = async (orders: Order[], language: string = 'en', filenameTag: string = '') => {
    const isChinese = language.startsWith('zh');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(isChinese ? '订单' : 'Orders');

    // Define headers
    worksheet.columns = [
        { header: isChinese ? '订单编号' : 'Order ID', key: 'id', width: 20 },
        { header: isChinese ? '订单日期' : 'Order Date', key: 'date', width: 20 },
        { header: isChinese ? '客户姓名' : 'Customer Name', key: 'customer', width: 15 },
        { header: isChinese ? '客户电话' : 'Customer Phone', key: 'phone', width: 15 },
        { header: isChinese ? '收货地址' : 'Address', key: 'address', width: 30 },
        { header: isChinese ? '款式名称' : 'Style Name', key: 'shoe', width: 30 },
        { header: isChinese ? '款式图片' : 'Style Image', key: 'image', width: 15 }, // New column
        { header: isChinese ? '尺码' : 'Size', key: 'size', width: 10 },
        { header: isChinese ? '价格' : 'Price', key: 'price', width: 10 },
        { header: isChinese ? '数量' : 'Quantity', key: 'quantity', width: 10 },
        { header: isChinese ? '商品总额' : 'Total Item Amount', key: 'total', width: 15 },
        { header: isChinese ? '快递公司' : 'Courier', key: 'courier', width: 15 },
        { header: isChinese ? '快递单号' : 'Tracking Number', key: 'tracking', width: 20 },
        { header: isChinese ? '状态' : 'Status', key: 'status', width: 10 }
    ];

    // Status translation map
    const statusMap: Record<string, string> = {
        'pending': '待发货',
        'shipped': '已发货',
        'delivered': '已送达'
    };

    const courierMap: Record<string, string> = {
        'SF': '顺丰速运',
        'YTO': '圆通速递',
        'STO': '申通快递',
        'ZTO': '中通快递',
        'YD': '韵达速递',
        'EMS': 'EMS/邮政',
        'J&T': '极兔速递'
    };

    // Add rows and images
    for (const order of orders) {
        for (const item of order.items) {
            const effectiveStatus = (order.shipping.trackingNumber && order.shipping.trackingNumber.trim().length > 0) ? 'shipped' : order.shipping.status;
            const row = worksheet.addRow({
                id: order.id,
                date: format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                customer: order.customer.name,
                phone: order.customer.phone,
                address: order.customer.address,
                shoe: item.name,
                image: '', // Placeholder for image
                size: item.size,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity,
                courier: isChinese ? (courierMap[order.shipping.company] || order.shipping.company) : order.shipping.company,
                tracking: order.shipping.trackingNumber,
                status: isChinese ? (statusMap[effectiveStatus] || effectiveStatus) : effectiveStatus
            });

            // If entry has an image, embed it
            if (item.image) {
                const buffer = await fetchImage(item.image);
                if (buffer) {
                    const imageId = workbook.addImage({
                        buffer: buffer,
                        extension: 'png', // Assuming PNG or handling generic
                    });

                    // Set row height to accommodate image
                    row.height = 60;

                    worksheet.addImage(imageId, {
                        tl: { col: 6, row: row.number - 1 }, // col 6 is 'image' (0-indexed)
                        ext: { width: 80, height: 80 },
                        editAs: 'oneCell'
                    });
                }
            }
        }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create download
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const tag = filenameTag ? `_${filenameTag}` : '';
    a.download = `SoleFlow_${isChinese ? '订单' : 'Orders'}${tag}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importFromExcel = async (file: File): Promise<Order[]> => {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return [];

    const orderMap = new Map<string, Order>();

    // Map to store images by row
    const rowImages = new Map<number, string>();
    worksheet.getImages().forEach(img => {
        const image = workbook.getImage(Number(img.imageId));
        if (image && image.buffer) {
            const base64Content = arrayBufferToBase64(image.buffer as ArrayBuffer);
            const base64 = `data:image/${image.extension};base64,${base64Content}`;
            // img.range.tl.row is 0-indexed row number
            rowImages.set(img.range.tl.row + 1, base64);
        }
    });

    // Get header row to find column indices
    const headerRow = worksheet.getRow(1);
    const colIndices: Record<string, number> = {};
    headerRow.eachCell((cell, colNumber) => {
        const val = cell.value?.toString().trim();
        if (val) colIndices[val] = colNumber;
    });

    const getVal = (row: ExcelJS.Row, ...keys: string[]) => {
        for (const key of keys) {
            const idx = colIndices[key];
            if (idx) {
                const cell = row.getCell(idx);
                return cell.value?.toString() || '';
            }
        }
        return '';
    };

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const orderId = getVal(row, 'Order ID', '订单编号') || crypto.randomUUID();
        const itemName = getVal(row, 'Style Name', '款式名称', 'Shoe Name', '鞋款名称') || 'Unknown Item';
        const price = Number(getVal(row, 'Price', '价格')) || 0;
        const size = getVal(row, 'Size', '尺码') || '42';
        const quantity = Number(getVal(row, 'Quantity', '数量')) || 1;
        const customerName = getVal(row, 'Customer Name', '客户姓名') || 'Unknown';
        const phone = getVal(row, 'Customer Phone', '客户电话') || '';
        const address = getVal(row, 'Address', '收货地址') || '';
        const courier = getVal(row, 'Courier', '快递公司') || 'SF';
        const tracking = getVal(row, 'Tracking Number', '快递单号') || '';
        const statusStr = getVal(row, 'Status', '状态').toLowerCase();
        const dateStr = getVal(row, 'Order Date', '订单日期');

        const item: OrderItem = {
            name: itemName,
            size: size,
            price: price,
            costPrice: 0,
            quantity: quantity,
            image: rowImages.get(rowNumber) || ''
        };

        if (orderMap.has(orderId)) {
            orderMap.get(orderId)!.items.push(item);
        } else {
            orderMap.set(orderId, {
                id: orderId,
                customer: {
                    name: customerName,
                    phone: phone,
                    address: address
                },
                items: [item],
                shipping: {
                    company: courier,
                    trackingNumber: tracking,
                    status: (statusStr === '已发货' || statusStr === 'shipped' ? 'shipped' : 'pending') as any
                },
                totalAmount: 0,
                totalCostAmount: 0,
                profit: 0,
                createdAt: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    });

    const result = Array.from(orderMap.values()).map(order => {
        order.totalAmount = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        order.totalCostAmount = order.items.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);
        order.profit = order.totalAmount - order.totalCostAmount;
        return order;
    });

    return result;
};
