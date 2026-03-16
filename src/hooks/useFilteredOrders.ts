import { useOrderStore } from '@/store/useOrderStore'
import { useMemo } from 'react'
import type { Order } from '@/types/order'

export function useFilteredOrders(): Order[] {
    const orders = useOrderStore(state => state.orders)
    const categoryFilter = useOrderStore(state => state.categoryFilter)

    return useMemo(() => {
        if (categoryFilter === 'all') return orders
        return orders.filter(order =>
            order.items.some(item => (item.category || 'shoes') === categoryFilter)
        )
    }, [orders, categoryFilter])
}
