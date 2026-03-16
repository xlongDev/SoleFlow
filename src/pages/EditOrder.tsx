import { useParams } from 'react-router-dom'
import { OrderForm } from '@/features/orders/components/OrderForm'
import { useTranslation } from 'react-i18next'

export function EditOrder() {
    const { id } = useParams<{ id: string }>()
    const { t } = useTranslation()

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
                        {t('orders.editTitle', { defaultValue: 'Edit Order' })}
                    </h1>
                    <p className="text-slate-500 mt-2">{t('orders.editSubtitle', { defaultValue: 'Update shipment details.' })}</p>
                </div>
            </div>

            <OrderForm orderId={id} />
        </div>
    )
}
