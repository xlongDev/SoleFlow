import * as React from "react"
import { Modal } from "./Modal"
import { Button } from "./LayoutPrimitives"
import { Input } from "./FormPrimitives"
import { useTranslation } from "react-i18next"

interface PromptModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (value: string) => void
    title: string
    placeholder?: string
    initialValue?: string
}

export function PromptModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    placeholder,
    initialValue = ""
}: PromptModalProps) {
    const { t } = useTranslation()
    const [value, setValue] = React.useState(initialValue)

    React.useEffect(() => {
        if (isOpen) {
            setValue(initialValue)
        }
    }, [isOpen, initialValue])

    const handleConfirm = () => {
        onConfirm(value)
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
            <div className="space-y-6">
                <Input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirm()
                    }}
                    className="h-12 px-4 rounded-xl border-slate-200 dark:border-white/10 focus:border-primary"
                />

                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl px-6">
                        {t('common.cancel') || 'Cancel'}
                    </Button>
                    <Button onClick={handleConfirm} className="rounded-xl px-6 shadow-lg shadow-primary/10">
                        {t('common.confirm') || 'Confirm'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
