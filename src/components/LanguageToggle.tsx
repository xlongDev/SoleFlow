import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300",
                "bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20",
                "border border-white/20 dark:border-white/5 shadow-sm backdrop-blur-md",
                "text-slate-600 dark:text-slate-300"
            )}
        >
            {i18n.language.startsWith('zh') ? '中文' : 'EN'}
        </button>
    );
}
