import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Inline alert — surface API/validation errors.
 * variant: 'error' | 'success' | 'warning' | 'info'
 */
const Alert = React.forwardRef(({ className, variant = 'info', ...props }, ref) => {
  const variantClasses = {
    error:   'border-rose-200   bg-rose-50   text-rose-600',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200  bg-amber-50  text-amber-700',
    info:    'border-[#7277F1]/20 bg-[#7277F1]/5 text-[#7277F1]',
  }
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'rounded-md border px-4 py-3 text-sm',
        variantClasses[variant] ?? variantClasses.info,
        className
      )}
      {...props}
    />
  )
})
Alert.displayName = 'Alert'

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm', className)} {...props} />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription }
