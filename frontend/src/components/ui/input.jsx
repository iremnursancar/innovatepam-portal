import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-navy-border bg-navy-950/60 px-3 py-2 text-sm text-slate-200',
        'ring-offset-navy-950 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-slate-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-rose-500/50 aria-invalid:ring-rose-500/30',
        'transition-colors duration-200',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
