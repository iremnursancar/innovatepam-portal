import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Inline alert — surface API/validation errors.
 * variant: 'error' | 'success' | 'warning' | 'info'
 */
const Alert = React.forwardRef(({ className, variant = 'info', ...props }, ref) => {
  const variantClasses = {
    error:   'border-red-200   bg-red-50   text-red-800',
    success: 'border-accent-200 bg-accent-50 text-accent-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    info:    'border-blue-200  bg-blue-50  text-blue-800',
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
