import { StatsCards } from '@/features/dashboard/components/StatsCards'
import { SalesChart } from '@/features/dashboard/components/SalesChart'
import { YearlyRevenueChart } from '@/features/dashboard/components/YearlyRevenueChart'
import { TopStylesChart } from '@/features/dashboard/components/TopStylesChart'
import { StatusPieChart } from '@/features/dashboard/components/StatusPieChart'
import { SizeAnalysisChart } from '@/features/dashboard/components/SizeAnalysisChart'
import { RegionAnalysisChart } from '@/features/dashboard/components/RegionAnalysisChart'
import { ProfitChart } from '@/features/dashboard/components/ProfitChart'
import { ShippingSpeedChart } from '@/features/dashboard/components/ShippingSpeedChart'
import { MarketingChart } from '@/features/dashboard/components/MarketingChart'
import { RefundChart } from '@/features/dashboard/components/RefundChart'
import { ExchangeChart } from '@/features/dashboard/components/ExchangeChart'
import { AftersalesExpenseChart } from '@/features/dashboard/components/AftersalesExpenseChart'
import { MonthlyMarketingChart } from '@/features/dashboard/components/MonthlyMarketingChart'
import { YearlyMarketingChart } from '@/features/dashboard/components/YearlyMarketingChart'
import { useTranslation } from 'react-i18next'
import { useOrderStore } from '@/store/useOrderStore'
import { Select } from '@/components/ui/FormPrimitives'
import { motion } from 'framer-motion'

export function Dashboard() {
    const { t, i18n } = useTranslation()
    const isChinese = i18n.language.startsWith('zh')
    const categoryFilter = useOrderStore(state => state.categoryFilter)
    const setCategoryFilter = useOrderStore(state => state.setCategoryFilter)

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
                        {t('dashboard.title')}
                    </h1>
                    <p className="text-slate-500 mt-2">{t('dashboard.subtitle')}</p>
                </div>
                <div className="w-full sm:w-48">
                    <Select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value as any)}
                        className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md"
                    >
                        <option value="all">{isChinese ? '全部类别' : 'All Categories'}</option>
                        <option value="shoes">{isChinese ? '鞋子' : 'Shoes'}</option>
                        <option value="clothes">{isChinese ? '衣服' : 'Clothes'}</option>
                        <option value="pants">{isChinese ? '裤子' : 'Pants'}</option>
                    </Select>
                </div>
            </div>

            <StatsCards />
            <motion.div
                key={categoryFilter}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-8"
            >
                {/* Row 1: Key Charts — Top Styles + Region + Size */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <TopStylesChart />
                    <RegionAnalysisChart />
                    <SizeAnalysisChart />
                </div>

                {/* Row 2: Marketing Overview — 3 equal columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <MarketingChart />
                    <MonthlyMarketingChart />
                    <YearlyMarketingChart />
                </div>

                {/* Row 3: Profit Trend (wide) + Order Status (narrow) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <ProfitChart />
                    </div>
                    <div className="lg:col-span-1">
                        <StatusPieChart />
                    </div>
                </div>

                {/* Row 4: Sales Trend (wide) + Refund Analysis (narrow) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <SalesChart />
                    </div>
                    <div className="lg:col-span-1">
                        <RefundChart />
                    </div>
                </div>

                {/* Row 5: Exchange + After-sales + Shipping — 3 equal columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <ExchangeChart />
                    <AftersalesExpenseChart />
                    <ShippingSpeedChart />
                </div>

                {/* Row 6: Yearly Revenue (full width) */}
                <div className="grid grid-cols-1 gap-8">
                    <YearlyRevenueChart />
                </div>
            </motion.div>
        </div>
    )
}
