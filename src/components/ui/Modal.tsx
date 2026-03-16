import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    maxWidth?: string
}

export function Modal({ isOpen, onClose, children, title, maxWidth = "max-w-lg" }: ModalProps) {
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className={cn("relative w-full transform rounded-3xl bg-white dark:bg-slate-900 border border-white/20 shadow-2xl p-6 max-h-[90vh] overflow-y-auto scrollbar-hide flex flex-col", maxWidth)}
                    >
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            {title && <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">{title}</h2>}
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
