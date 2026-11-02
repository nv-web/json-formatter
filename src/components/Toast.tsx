import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cx } from '../lib/cx'
import type { ToastMessage } from '../types/ui'

const toneStyles = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    border: 'border-emerald-200/80 dark:border-emerald-400/20',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-500',
    border: 'border-rose-200/80 dark:border-rose-400/20',
  },
  info: {
    icon: Info,
    iconClass: 'text-sky-500',
    border: 'border-sky-200/80 dark:border-sky-400/20',
  },
} as const

interface ToastProps {
  toast: ToastMessage | null
  onDismiss: () => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null

  const tone = toneStyles[toast.tone]
  const Icon = tone.icon

  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end"
    >
      <div
        className={cx(
          'animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-white px-3.5 py-3 shadow-xl shadow-slate-900/10 dark:bg-[#0d1420] dark:shadow-black/40',
          tone.border,
        )}
      >
        <Icon className={cx('mt-0.5 size-4 shrink-0', tone.iconClass)} />
        <p className="min-w-0 flex-1 text-xs leading-5 text-slate-700 dark:text-slate-200">
          {toast.message}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.08] dark:hover:text-slate-200"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
