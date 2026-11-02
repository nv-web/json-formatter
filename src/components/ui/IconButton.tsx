import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { Tooltip } from './Tooltip'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
  tooltipSide?: 'top' | 'bottom'
}

export function IconButton({
  label,
  children,
  className,
  tooltipSide = 'top',
  ...props
}: IconButtonProps) {
  return (
    <Tooltip label={label} side={tooltipSide}>
      <button
        type="button"
        aria-label={label}
        title={label}
        className={cx(
          'inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  )
}
