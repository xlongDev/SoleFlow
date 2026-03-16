import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Order } from '@/types/order'

export type CategoryFilter = 'all' | 'shoes' | 'clothes' | 'pants';

interface OrderStore {
    orders: Order[];
    categoryFilter: CategoryFilter;
    setCategoryFilter: (filter: CategoryFilter) => void;
    addOrder: (order: Order) => void;
    updateOrder: (id: string, updates: Partial<Order>) => void;
    deleteOrder: (id: string) => void;
    importOrders: (newOrders: Order[]) => void;
    clearOrders: () => void;
}

export const useOrderStore = create<OrderStore>()(
    persist(
        (set) => ({
            orders: [],
            categoryFilter: 'all',
            setCategoryFilter: (filter) => set({ categoryFilter: filter }),
            addOrder: (order) => set((state) => {
                const totalAmount = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
                const totalCostAmount = order.items.reduce((acc, item) => acc + ((item.costPrice || 0) * item.quantity), 0)
                const profit = totalAmount - totalCostAmount
                return { orders: [{ ...order, totalAmount, totalCostAmount, profit }, ...state.orders] }
            }),
            updateOrder: (id, updates) => set((state) => ({
                orders: state.orders.map((order) => {
                    if (order.id === id) {
                        const newOrder = { ...order, ...updates, updatedAt: new Date().toISOString() }
                        const totalAmount = newOrder.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) ?? newOrder.totalAmount
                        const totalCostAmount = newOrder.items?.reduce((acc, item) => acc + ((item.costPrice || 0) * item.quantity), 0) ?? newOrder.totalCostAmount
                        const profit = totalAmount - totalCostAmount
                        return { ...newOrder, totalAmount, totalCostAmount, profit }
                    }
                    return order
                })
            })),
            deleteOrder: (id) => set((state) => ({
                orders: state.orders.filter((order) => order.id !== id)
            })),
            importOrders: (newOrders) => set((state) => ({
                orders: [...newOrders, ...state.orders]
            })),
            clearOrders: () => set({ orders: [] })
        }),
        {
            name: 'order-storage',
            storage: createJSONStorage(() => localStorage),
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
            }
        }
    )
)
