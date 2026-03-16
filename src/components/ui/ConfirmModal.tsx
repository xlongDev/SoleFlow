import { Modal } from "./Modal"
import { Button } from "./LayoutPrimitives"
import { useTranslation } from "react-i18next"
import { AlertCircle } from "lucide-react"

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "destructive" | "primary"
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText,
    cancelText,
    variant = "destructive"
}: ConfirmModalProps) {
    const { t } = useTranslation()

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <AlertCircle size={24} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl px-6">
                        {cancelText || t('common.cancel') || 'Cancel'}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        className="rounded-xl px-6 shadow-lg shadow-primary/10"
                    >
                        {confirmText || t('common.confirm') || 'Confirm'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
