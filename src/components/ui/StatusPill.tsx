import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import type { ValidationState } from '../../types/ui'

interface StatusPillProps {
  state: ValidationState
  isProcessing?: boolean
}

export function StatusPill({ state, isProcessing = false }: StatusPillProps) {
  if (isProcessing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
        <Loader2 className="size-3 animate-spin" />
        <span className="hidden sm:inline">Checking</span>
      </span>
    )
  }

  if (state === 'valid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
        <CheckCircle2 className="size-3" />
        <span className="hidden sm:inline">Valid</span>
      </span>
    )
  }

  if (state === 'invalid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
        <AlertCircle className="size-3" />
        <span className="hidden sm:inline">Invalid</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
      Empty
    </span>
  )
}
