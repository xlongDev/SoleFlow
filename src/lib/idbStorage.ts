import type { StateStorage } from 'zustand/middleware'

/**
 * A simple IndexedDB wrapper for Zustand persistence
 * This allows storing much larger amounts of data (GBs) than localStorage (5MB)
 */
export const idbStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return new Promise((resolve) => {
            const request = indexedDB.open('order-system-db', 1);
            
            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('keyvaluepairs')) {
                    db.createObjectStore('keyvaluepairs');
                }
            };

            request.onsuccess = (event: any) => {
                const db = event.target.result;
                const transaction = db.transaction('keyvaluepairs', 'readonly');
                const store = transaction.objectStore('keyvaluepairs');
                const getRequest = store.get(name);

                getRequest.onsuccess = () => {
                    resolve(getRequest.result || null);
                };
                getRequest.onerror = () => resolve(null);
            };

            request.onerror = () => resolve(null);
        });
    },
    setItem: async (name: string, value: string): Promise<void> => {
        return new Promise((resolve) => {
            const request = indexedDB.open('order-system-db', 1);

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('keyvaluepairs')) {
                    db.createObjectStore('keyvaluepairs');
                }
            };

            request.onsuccess = (event: any) => {
                const db = event.target.result;
                const transaction = db.transaction('keyvaluepairs', 'readwrite');
                const store = transaction.objectStore('keyvaluepairs');
                store.put(value, name);
                transaction.oncomplete = () => resolve();
            };

            request.onerror = () => resolve();
        });
    },
    removeItem: async (name: string): Promise<void> => {
        return new Promise((resolve) => {
            const request = indexedDB.open('order-system-db', 1);

            request.onsuccess = (event: any) => {
                const db = event.target.result;
                const transaction = db.transaction('keyvaluepairs', 'readwrite');
                const store = transaction.objectStore('keyvaluepairs');
                store.delete(name);
                transaction.oncomplete = () => resolve();
            };

            request.onerror = () => resolve();
        });
    },
}
