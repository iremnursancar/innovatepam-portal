import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'bg-gradient-to-r from-cyan-500 to-cyan-400 text-navy-950 font-semibold hover:from-cyan-400 hover:to-cyan-300 shadow-glow-cyan hover:shadow-[0_0_28px_rgba(6,182,212,0.45)]',
        destructive: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30',
        outline:     'border border-navy-border bg-navy-card/60 text-slate-300 hover:border-slate-500 hover:text-slate-100',
        secondary:   'bg-navy-800/60 text-slate-300 hover:bg-navy-700/60',
        ghost:       'text-slate-400 hover:bg-navy-800/40 hover:text-slate-200',
        link:        'text-cyan-400 underline-offset-4 hover:underline hover:text-cyan-300',
        accent:      'bg-gradient-to-r from-emerald-500 to-emerald-400 text-navy-950 font-semibold hover:from-emerald-400 hover:to-emerald-300 shadow-glow-emerald',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-9 rounded-md px-3',
        lg:      'h-11 rounded-md px-8 text-base',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
