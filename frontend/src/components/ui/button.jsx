import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7277F1]/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'text-white font-semibold hover:opacity-90',
        destructive: 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100',
        outline:     'border border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900',
        secondary:   'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ghost:       'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
        link:        'text-[#7277F1] underline-offset-4 hover:underline hover:opacity-80',
        accent:      'text-white font-semibold hover:opacity-90',
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
