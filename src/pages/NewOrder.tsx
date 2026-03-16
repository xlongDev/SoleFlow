import { OrderForm } from '@/features/orders/components/OrderForm'
import { useTranslation } from 'react-i18next'

export function NewOrder() {
    const { t } = useTranslation()

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
                        {t('newOrder.title')}
                    </h1>
                    <p className="text-slate-500 mt-2">{t('newOrder.subtitle')}</p>
                </div>
            </div>

            <OrderForm />
        </div>
    )
}
