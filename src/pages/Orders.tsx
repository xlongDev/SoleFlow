import { OrderList } from '@/features/orders/components/OrderList'
import { Button } from '@/components/ui/LayoutPrimitives'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Orders() {
    const { t } = useTranslation()

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
                        {t('orders.title')}
                    </h1>
                    <p className="text-slate-500 mt-2">{t('orders.subtitle')}</p>
                </div>
                <Link to="/orders/new">
                    <Button className="gap-2 shadow-lg shadow-primary/25">
                        <Plus size={18} /> {t('orders.create')}
                    </Button>
                </Link>
            </div>

            <OrderList />
        </div>
    )
}
