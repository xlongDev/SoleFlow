import { cn } from '@/lib/utils'

export function SiteMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={cn("w-6 h-6", className)}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
        </svg>
    )
}
