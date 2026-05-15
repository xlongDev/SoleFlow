import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Order } from '@/types/order'
import { idbStorage } from '@/lib/idbStorage'

export type CategoryFilter = 'all' | 'shoes' | 'clothes' | 'pants';

interface OrderStore {
    orders: Order[];
    categoryFilter: CategoryFilter;
    setCategoryFilter: (filter: CategoryFilter) => void;
    addOrder: (order: Order) => void;
    updateOrder: (id: string, updates: Partial<Order>) => void;
    deleteOrder: (id: string) => void;
    deleteOrders: (ids: string[]) => void;
    importOrders: (newOrders: Order[]) => void;
    clearOrders: () => void;
}

export const useOrderStore = create<OrderStore>()(
    persist(
        (set) => {
            const normalizeOrder = (order: Order): Order => {
                const safeItems = Array.isArray(order.items)
                    ? order.items.filter(Boolean).map(item => ({
                        name: item.name || '',
                        image: item.image || '',
                        size: item.size || '42',
                        price: Number(item.price || 0),
                        costPrice: Number(item.costPrice || 0),
                        quantity: Math.max(1, Number(item.quantity || 1)),
                        category: item.category || 'shoes',
                        isRefunded: !!item.isRefunded,
                        refundReason: item.refundReason
                    }))
                    : []
                const activeItems = safeItems.filter(item => !item.isRefunded)
                const totalAmount = activeItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
                const totalCostAmount = activeItems.reduce((acc, item) => acc + ((item.costPrice || 0) * item.quantity), 0)
                const profit = totalAmount - totalCostAmount
                return {
                    ...order,
                    customer: order.customer || { name: '', phone: '', address: '' },
                    shipping: {
                        company: order.shipping?.company || 'ZTO',
                        trackingNumber: order.shipping?.trackingNumber || '',
                        status: order.shipping?.status || 'pending'
                    },
                    items: safeItems,
                    totalAmount,
                    totalCostAmount,
                    profit
                }
            }

            return ({
            orders: [],
            categoryFilter: 'all',
            setCategoryFilter: (filter) => set({ categoryFilter: filter }),
            addOrder: (order) => set((state) => {
                return { orders: [normalizeOrder(order), ...state.orders] }
            }),
            updateOrder: (id, updates) => set((state) => ({
                orders: state.orders.map((order) => {
                    if (order.id === id) {
                        const newOrder = { ...order, ...updates, updatedAt: new Date().toISOString() }
                        return normalizeOrder(newOrder)
                    }
                    return order
                })
            })),
            deleteOrder: (id) => set((state) => ({
                orders: state.orders.filter((order) => order.id !== id)
            })),
            deleteOrders: (ids) => set((state) => {
                const idsSet = new Set(ids)
                return { orders: state.orders.filter((order) => !idsSet.has(order.id)) }
            }),
            importOrders: (newOrders) => set((state) => ({
                orders: (() => {
                    const merged = new Map<string, Order>()
                    state.orders.forEach(order => merged.set(order.id, normalizeOrder(order)))
                    newOrders.forEach(order => merged.set(order.id, normalizeOrder(order)))
                    return Array.from(merged.values()).sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                })()
            })),
            clearOrders: () => set({ orders: [] })
        })
        },
        {
            name: 'order-storage',
            storage: createJSONStorage(() => idbStorage),
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    return {
                        ...persistedState,
                        orders: persistedState.orders.map((order: any) => {
                            if (order.item && !order.items) {
                                const items = [order.item]
                                const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
                                const { item, ...rest } = order
                                return { ...rest, items, totalAmount }
                            }
                            return order
                        })
                    }
                }
                return persistedState
            },
            onRehydrateStorage: () => {
                console.log('[order-store] Rehydration starting...');
                return (rehydratedState, error) => {
                    if (error) {
                        console.error('[order-store] Rehydration failed:', error);
                    } else {
                        console.log('[order-store] Rehydration finished. Orders count:', rehydratedState?.orders?.length || 0);
                    }
                };
            }
        }
    )
)
