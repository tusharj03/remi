import { forwardRef } from "react"
import { Loader } from "lucide-react"
import { cn } from "@/lib/utils"

const Button = forwardRef(({ className, variant = "primary", size = "default", isLoading, children, ...props }, ref) => {
    const variants = {
        primary: "bg-white text-slate-950 hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]",
        secondary: "bg-slate-800 text-white hover:bg-slate-700",
        outline: "border-2 border-slate-700 text-white hover:border-slate-500 hover:bg-slate-800/50",
        ghost: "text-slate-400 hover:text-white hover:bg-slate-800/30",
        danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
        success: "bg-green-500 text-slate-950 hover:bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]"
    }

    const sizes = {
        default: "h-12 px-6 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-14 px-8 text-lg",
        xl: "h-16 px-8 text-xl",
        icon: "h-10 w-10 flex items-center justify-center p-0"
    }

    return (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading}
            {...props}
        >
            {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    )
})
Button.displayName = "Button"

export { Button }
