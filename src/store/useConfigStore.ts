import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
    setLogo: (logo: string | null) => void;
    setPrimaryColor: (color: string) => void;
    setBrandName: (name: string) => void;
    setLightBgColor: (color: string) => void;
    setDarkBgColor: (color: string) => void;
    setLightCardBg: (color: string) => void;
    setDarkCardBg: (color: string) => void;
    setAccentColor: (color: string) => void;
    setSuppliers: (suppliers: string[]) => void;
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
            setSuppliers: (suppliers) => set({ suppliers }),

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
