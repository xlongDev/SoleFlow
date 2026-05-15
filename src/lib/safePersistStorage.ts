import { createJSONStorage, type StateStorage } from 'zustand/middleware'

const memory = new Map<string, string>()

/**
 * localStorage 写入失败（如 QuotaExceeded）时，zustand persist 默认会抛错，
 * 导致业务逻辑已执行但 UI 仍显示失败。此处吞掉写入错误并回退到内存，避免误报。
 */
function createSafeStorage(): StateStorage {
    return {
        getItem: (name) => {
            let value: string | null = null;
            try {
                value = localStorage.getItem(name);
            } catch (e) {
                console.warn(`[persist] localStorage.getItem('${name}') failed:`, e);
            }
            // If localStorage returns null (not found) or throws, check memory fallback
            return value ?? memory.get(name) ?? null;
        },
        setItem: (name, value) => {
            try {
                localStorage.setItem(name, value)
                memory.delete(name)
            } catch (e) {
                console.warn('[persist] localStorage.setItem failed, using memory fallback', e)
                memory.set(name, value)
            }
        },
        removeItem: (name) => {
            try {
                localStorage.removeItem(name)
            } catch {
                /* ignore */
            }
            memory.delete(name)
        }
    }
}

export const safePersistJSONStorage = createJSONStorage(() => createSafeStorage())
