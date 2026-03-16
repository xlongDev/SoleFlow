import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
    theme: 'light' | 'dark' | 'system'
    setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: 'system',
            setTheme: (theme) => {
                set({ theme })
                const root = window.document.documentElement
                root.classList.remove('light', 'dark')

                if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
                        .matches
                        ? 'dark'
                        : 'light'
                    root.classList.add(systemTheme)
                    return
                }

                root.classList.add(theme)
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setTheme(state.theme)
                }
            }
        }
    )
)
