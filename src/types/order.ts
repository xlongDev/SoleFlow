export type CourierCompany = 'SF' | 'YTO' | 'STO' | 'ZTO' | 'YD' | 'EMS' | 'J&T' | 'Postal';

export type ItemCategory = 'shoes' | 'clothes' | 'pants';

export interface OrderItem {
    name: string;
    image: string;
    size: string;
    price: number;
    costPrice: number;
    quantity: number;
    category?: ItemCategory;
    isRefunded?: boolean;
    refundReason?: string;
    isExchanged?: boolean;
    exchangeReason?: string;
    exchangeSize?: string;
    returnCost?: number;
    exchangeCost?: number;
    aftersalesCourierCompany?: string;
    aftersalesTrackingNumber?: string;
    originalSize?: number;
    compressedSize?: number;
}

export interface Order {
    id: string;
    customer: {
        name: string;
        phone: string;
        address: string;
    };
    items: OrderItem[];
    shipping: {
        company: CourierCompany | string;
        trackingNumber: string;
        status: 'pending' | 'shipped' | 'delivered';
    };
    totalAmount: number;
    totalCostAmount: number;
    profit: number;
    createdAt: string;
    updatedAt: string;
    shippedAt?: string;
    supplier?: string;
    remarks?: string;
}

export const COURIER_OPTIONS: { value: string; label: string; urlQuery?: string }[] = [
    { value: 'ZTO', label: '中通快递', urlQuery: 'https://www.zto.com/check/detail?waybills=' },
    { value: 'SF', label: '顺丰速运', urlQuery: 'https://www.sf-express.com/cn/sc/dynamic_function/waybill/#search/bill-number/' },
    { value: 'YTO', label: '圆通速递', urlQuery: 'https://www.yto.net.cn/track/track-result.html?billno=' },
    { value: 'STO', label: '申通快递', urlQuery: 'http://www.sto.cn/Track/Index?billCode=' },
    { value: 'YD', label: '韵达速递', urlQuery: 'http://www.yundaex.com/cn/index.php' }, // Requires complex query usually, but keeping text
    { value: 'EMS', label: 'EMS/邮政', urlQuery: 'https://www.ems.com.cn/apple/query/' },
    { value: 'J&T', label: '极兔速递', urlQuery: 'https://www.jtexpress.com.cn/trajectoryQuery' },
    { value: 'OTHER', label: '其他快递' }
];

export const SIZE_MAPPING = [
    { eur: '35.5', us: '3.5' },
    { eur: '36', us: '4' },
    { eur: '36.5', us: '4.5' },
    { eur: '37.5', us: '5' },
    { eur: '38', us: '5.5' },
    { eur: '38.5', us: '6' },
    { eur: '39', us: '6.5' },
    { eur: '40', us: '7' },
    { eur: '40.5', us: '7.5' },
    { eur: '41', us: '8' },
    { eur: '42', us: '8.5' },
    { eur: '42.5', us: '9' },
    { eur: '43', us: '9.5' },
    { eur: '44', us: '10' },
    { eur: '44.5', us: '10.5' },
    { eur: '45', us: '11' },
    { eur: '45.5', us: '11.5' },
    { eur: '46', us: '12' },
    { eur: '47.5', us: '13' },
];

export const NIKE_SIZES = SIZE_MAPPING.map(s => s.eur);

export const CLOTHING_SIZE_MAPPING = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
export const PANTS_SIZE_MAPPING = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42', '44'];
