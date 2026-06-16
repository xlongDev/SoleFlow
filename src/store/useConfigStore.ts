import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safePersistJSONStorage } from '@/lib/safePersistStorage'
import type { SupplierAftercare } from '@/types/supplier'
import { emptySupplierAftercare } from '@/types/supplier'

function buildAftercareMap(suppliers: string[], existing: Record<string, SupplierAftercare> = {}) {
    const next: Record<string, SupplierAftercare> = { ...existing }
    suppliers.forEach((name) => {
        if (!next[name]) next[name] = emptySupplierAftercare()
    })
    Object.keys(next).forEach((key) => {
        if (!suppliers.includes(key)) delete next[key]
    })
    return next
}

interface ConfigStore {
    logo: string | null;
    primaryColor: string;
    brandName: string;
    lightBgColor: string;
    darkBgColor: string;
    lightCardBg: string;
    darkCardBg: string;
    accentColor: string;
    suppliers: string[];
    supplierAftercare: Record<string, SupplierAftercare>;
    imageCompressionEnabled: boolean;
    imageCompressionQuality: number;
    posterCompressionEnabled: boolean;
    posterCompressionQuality: number;
    maxImageWidth: number;
    setLogo: (logo: string | null) => void;
    setPrimaryColor: (color: string) => void;
    setBrandName: (name: string) => void;
    setLightBgColor: (color: string) => void;
    setDarkBgColor: (color: string) => void;
    setLightCardBg: (color: string) => void;
    setDarkCardBg: (color: string) => void;
    setAccentColor: (color: string) => void;
    setSuppliers: (suppliers: string[]) => void;
    updateSupplierAftercare: (supplierName: string, patch: Partial<SupplierAftercare>) => void;
    setImageCompressionEnabled: (enabled: boolean) => void;
    setImageCompressionQuality: (quality: number) => void;
    setPosterCompressionEnabled: (enabled: boolean) => void;
    setPosterCompressionQuality: (quality: number) => void;
    setMaxImageWidth: (width: number) => void;
    exportSettings: () => string;
    importSettings: (jsonString: string) => boolean;
    resetToDefault: () => void;
}

export const useConfigStore = create<ConfigStore>()(
    persist(
        (set, get) => ({
            logo: null,
            primaryColor: '#6366f1',
            brandName: 'SoleFlow',
            lightBgColor: '#f8fafc',
            darkBgColor: '#0f172a',
            lightCardBg: '#ffffff',
            darkCardBg: '#1e293b',
            accentColor: '#8b5cf6',
            suppliers: ['Default Supplier'],
            supplierAftercare: {
                'Default Supplier': emptySupplierAftercare()
            },
            imageCompressionEnabled: true,
            imageCompressionQuality: 0.8,
            posterCompressionEnabled: true,
            posterCompressionQuality: 0.85,
            maxImageWidth: 1280,

            setLogo: (logo) => set({ logo }),
            setPrimaryColor: (color) => {
                set({ primaryColor: color })
                document.documentElement.style.setProperty('--primary-color', color)
            },
            setBrandName: (name) => set({ brandName: name }),
            setLightBgColor: (color) => {
                set({ lightBgColor: color });
                document.documentElement.style.setProperty('--light-bg', color);
            },
            setDarkBgColor: (color) => {
                set({ darkBgColor: color });
                document.documentElement.style.setProperty('--dark-bg', color);
            },
            setLightCardBg: (color) => {
                set({ lightCardBg: color });
                document.documentElement.style.setProperty('--light-card', color);
            },
            setDarkCardBg: (color) => {
                set({ darkCardBg: color });
                document.documentElement.style.setProperty('--dark-card', color);
            },
            setAccentColor: (color) => {
                set({ accentColor: color });
                document.documentElement.style.setProperty('--accent-color', color);
            },
            setSuppliers: (suppliers) => set((state) => ({
                suppliers,
                supplierAftercare: buildAftercareMap(suppliers, state.supplierAftercare)
            })),
            updateSupplierAftercare: (supplierName, patch) => set((state) => ({
                supplierAftercare: {
                    ...state.supplierAftercare,
                    [supplierName]: {
                        ...emptySupplierAftercare(),
                        ...state.supplierAftercare[supplierName],
                        ...patch
                    }
                }
            })),
            setImageCompressionEnabled: (enabled) => set({ imageCompressionEnabled: enabled }),
            setImageCompressionQuality: (quality) => set({ imageCompressionQuality: quality }),
            setPosterCompressionEnabled: (enabled) => set({ posterCompressionEnabled: enabled }),
            setPosterCompressionQuality: (quality) => set({ posterCompressionQuality: quality }),
            setMaxImageWidth: (width) => set({ maxImageWidth: width }),

            exportSettings: () => {
                const state = get();
                const settings = {
                    logo: state.logo,
                    primaryColor: state.primaryColor,
                    brandName: state.brandName,
                    lightBgColor: state.lightBgColor,
                    darkBgColor: state.darkBgColor,
                    lightCardBg: state.lightCardBg,
                    darkCardBg: state.darkCardBg,
                    accentColor: state.accentColor,
                    suppliers: state.suppliers,
                    supplierAftercare: state.supplierAftercare,
                    imageCompressionEnabled: state.imageCompressionEnabled,
                    imageCompressionQuality: state.imageCompressionQuality,
                    posterCompressionEnabled: state.posterCompressionEnabled,
                    posterCompressionQuality: state.posterCompressionQuality,
                    maxImageWidth: state.maxImageWidth,
                    exportDate: new Date().toISOString()
                };
                return JSON.stringify(settings, null, 2);
            },

            importSettings: (jsonString: string) => {
                try {
                    const settings = JSON.parse(jsonString);
                    const newState: Partial<ConfigStore> = {};

                    if (settings.logo !== undefined) newState.logo = settings.logo;
                    if (settings.primaryColor) {
                        newState.primaryColor = settings.primaryColor;
                        document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
                    }
                    if (settings.brandName) newState.brandName = settings.brandName;
                    if (settings.suppliers) newState.suppliers = settings.suppliers;
                    if (settings.supplierAftercare && typeof settings.supplierAftercare === 'object') {
                        newState.supplierAftercare = buildAftercareMap(
                            settings.suppliers || get().suppliers,
                            settings.supplierAftercare
                        );
                    } else if (settings.suppliers) {
                        newState.supplierAftercare = buildAftercareMap(settings.suppliers, get().supplierAftercare);
                    }
                    if (settings.imageCompressionEnabled !== undefined) newState.imageCompressionEnabled = settings.imageCompressionEnabled;
                    if (settings.imageCompressionQuality !== undefined) newState.imageCompressionQuality = settings.imageCompressionQuality;
                    if (settings.posterCompressionEnabled !== undefined) newState.posterCompressionEnabled = settings.posterCompressionEnabled;
                    if (settings.posterCompressionQuality !== undefined) newState.posterCompressionQuality = settings.posterCompressionQuality;
                    if (settings.maxImageWidth !== undefined) newState.maxImageWidth = settings.maxImageWidth;

                    if (settings.lightBgColor) {
                        newState.lightBgColor = settings.lightBgColor;
                        document.documentElement.style.setProperty('--light-bg', settings.lightBgColor);
                    }
                    if (settings.darkBgColor) {
                        newState.darkBgColor = settings.darkBgColor;
                        document.documentElement.style.setProperty('--dark-bg', settings.darkBgColor);
                    }
                    if (settings.lightCardBg) {
                        newState.lightCardBg = settings.lightCardBg;
                        document.documentElement.style.setProperty('--light-card', settings.lightCardBg);
                    }
                    if (settings.darkCardBg) {
                        newState.darkCardBg = settings.darkCardBg;
                        document.documentElement.style.setProperty('--dark-card', settings.darkCardBg);
                    }
                    if (settings.accentColor) {
                        newState.accentColor = settings.accentColor;
                        document.documentElement.style.setProperty('--accent-color', settings.accentColor);
                    }

                    set(newState);
                    return true;
                } catch (error) {
                    console.error('Failed to import settings:', error);
                    return false;
                }
            },

            resetToDefault: () => {
                const defaults = {
                    logo: null,
                    primaryColor: '#6366f1',
                    brandName: 'SoleFlow',
                    lightBgColor: '#f8fafc',
                    darkBgColor: '#0f172a',
                    lightCardBg: '#ffffff',
                    darkCardBg: '#1e293b',
                    accentColor: '#8b5cf6',
                    suppliers: ['Default Supplier'],
                    supplierAftercare: { 'Default Supplier': emptySupplierAftercare() },
                    imageCompressionEnabled: true,
                    imageCompressionQuality: 0.8,
                    posterCompressionEnabled: true,
                    posterCompressionQuality: 0.85,
                    maxImageWidth: 1280,
                };
                set(defaults);
                document.documentElement.style.setProperty('--primary-color', defaults.primaryColor);
                document.documentElement.style.setProperty('--light-bg', defaults.lightBgColor);
                document.documentElement.style.setProperty('--dark-bg', defaults.darkBgColor);
                document.documentElement.style.setProperty('--light-card', defaults.lightCardBg);
                document.documentElement.style.setProperty('--dark-card', defaults.darkCardBg);
                document.documentElement.style.setProperty('--accent-color', defaults.accentColor);
            }
        }),
        {
            name: 'config-storage',
            storage: safePersistJSONStorage,
            version: 2,
            migrate: (persistedState: any, version: number) => {
                if (!persistedState) return persistedState
                if (version < 2) {
                    const suppliers: string[] = Array.isArray(persistedState.suppliers)
                        ? persistedState.suppliers
                        : ['Default Supplier']
                    return {
                        ...persistedState,
                        suppliers,
                        supplierAftercare: buildAftercareMap(suppliers, persistedState.supplierAftercare)
                    }
                }
                return persistedState
            },
            onRehydrateStorage: () => (state) => {
                if (state) {
                    if (state.primaryColor) document.documentElement.style.setProperty('--primary-color', state.primaryColor);
                    if (state.lightBgColor) document.documentElement.style.setProperty('--light-bg', state.lightBgColor);
                    if (state.darkBgColor) document.documentElement.style.setProperty('--dark-bg', state.darkBgColor);
                    if (state.lightCardBg) document.documentElement.style.setProperty('--light-card', state.lightCardBg);
                    if (state.darkCardBg) document.documentElement.style.setProperty('--dark-card', state.darkCardBg);
                    if (state.accentColor) document.documentElement.style.setProperty('--accent-color', state.accentColor);
                }
            }
        }
    )
)
