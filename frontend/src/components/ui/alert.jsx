import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Inline alert — surface API/validation errors.
 * variant: 'error' | 'success' | 'warning' | 'info'
 */
const Alert = React.forwardRef(({ className, variant = 'info', ...props }, ref) => {
  const variantClasses = {
    error:   'border-rose-500/30   bg-rose-500/10   text-rose-300',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    warning: 'border-amber-500/30  bg-amber-500/10  text-amber-300',
    info:    'border-cyan-500/30   bg-cyan-500/10   text-cyan-300',
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
