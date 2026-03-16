import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => (
        <label
            ref={ref}
            className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-500 dark:text-slate-400 ml-1", className)}
            {...props}
        />
    )
)
Label.displayName = "Label"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 backdrop-blur-sm shadow-sm",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"


export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, children, value, onChange, ...props }, ref) => {
        const [isOpen, setIsOpen] = React.useState(false)
        const containerRef = React.useRef<HTMLDivElement>(null)
        const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({})

        const updatePosition = React.useCallback(() => {
            if (containerRef.current && isOpen) {
                const rect = containerRef.current.getBoundingClientRect()
                setDropdownStyle({
                    position: 'fixed',
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width,
                    zIndex: 99999
                })
            }
        }, [isOpen])

        React.useEffect(() => {
            if (isOpen) {
                updatePosition()
                window.addEventListener('scroll', updatePosition, true)
                window.addEventListener('resize', updatePosition)
            }
            return () => {
                window.removeEventListener('scroll', updatePosition, true)
                window.removeEventListener('resize', updatePosition)
            }
        }, [isOpen, updatePosition])

        React.useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    // Check if click was inside the dropdown portal
                    const dropdown = document.getElementById('select-dropdown-portal')
                    if (dropdown && dropdown.contains(event.target as Node)) {
                        return
                    }
                    setIsOpen(false)
                }
            }
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }, [])

        const options: { value: string, label: string }[] = []
        React.Children.forEach(children, child => {
            if (React.isValidElement(child) && child.type === 'option') {
                const element = child as React.ReactElement<{ value: string; children: React.ReactNode }>
                options.push({
                    value: String(element.props.value),
                    label: String(element.props.children)
                })
            }
        })

        const selectedOption = options.find(opt => opt.value === String(value)) || options[0]

        const handleSelect = (val: string) => {
            setIsOpen(false)
            if (onChange) {
                const event = {
                    target: { value: val }
                } as React.ChangeEvent<HTMLSelectElement>
                onChange(event)
            }
        }

        const dropdownMenu = isOpen ? (
            <div 
                id="select-dropdown-portal"
                className="fixed z-[99999] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto"
                style={dropdownStyle}
            >
                {options.map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        className={cn(
                            "w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                            String(value) === String(opt.value) && "bg-primary/10 text-primary hover:bg-primary/20 font-medium"
                        )}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSelect(opt.value)
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        ) : null;

        return (
            <div
                className={cn(
                    "relative flex h-12 w-full appearance-none items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 backdrop-blur-sm shadow-sm",
                    className
                )}
                ref={containerRef}
            >
                <button
                    type="button"
                    className="w-full h-full px-4 flex items-center justify-between outline-none bg-transparent"
                    onClick={(e) => {
                        e.preventDefault()
                        setIsOpen(!isOpen)
                    }}
                >
                    <span className="truncate">{selectedOption?.label}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("transition-transform duration-200 opacity-50 ml-2", isOpen && "rotate-180")}>
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {isOpen && typeof document !== 'undefined' ? createPortal(dropdownMenu, document.body) : null}
                
                {/* Hidden native select for form refs/accessibility if needed */}
                <select className="hidden" ref={ref} value={value} onChange={onChange} {...props}>
                    {children}
                </select>
            </div>
        )
    }
)
Select.displayName = "Select"
