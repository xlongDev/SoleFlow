
import type { Order } from '@/types/order';
import { format } from 'date-fns';

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                resolve(base64data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error fetching image for JSON export:', error);
        return null;
    }
};

export const exportToJson = async (orders: Order[], language: string = 'en', filenameTag: string = '') => {
    const isChinese = language.startsWith('zh');

    // Deep clone orders to avoid modifying original state
    const ordersToExport = JSON.parse(JSON.stringify(orders));

    // Update status based on tracking number for export
    for (const order of ordersToExport) {
        if (order.shipping.trackingNumber && order.shipping.trackingNumber.trim().length > 0) {
            order.shipping.status = 'shipped';
        }
    }

    // Convert images to base64
    for (const order of ordersToExport) {
        for (const item of order.items) {
            if (item.image) {
                // If it's already base64, keep it. If URL, fetch it.
                if (item.image.startsWith('data:')) continue;

                const base64 = await fetchImageAsBase64(item.image);
                if (base64) {
                    item.image = base64;
                }
            }
        }
    }

    const jsonString = JSON.stringify(ordersToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const tag = filenameTag ? `_${filenameTag}` : '';
    a.download = `SoleFlow_${isChinese ? '订单' : 'Orders'}${tag}_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importFromJson = (file: File): Promise<Order[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const orders = JSON.parse(content);
                if (Array.isArray(orders)) {
                    resolve(orders);
                } else {
                    reject(new Error('Invalid JSON format: expected an array of orders'));
                }
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};
