import cn from 'clsx'
import type { ComponentProps, ReactElement } from 'react'

export function StepsHeader({
  children,
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <h3
      className={cn(
        'nx-font-semibold nx-tracking-tight nx-text-slate-900',
        'dark:nx-text-slate-100 nx-mt-8 nx-text-2xl',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}
