import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Loader2,
  MoveRight,
} from 'lucide-react'
import { formatNumber } from '../lib/json/core'
import type { JsonErrorKind, ProcessingResult } from '../types/json'

const errorKindLabels: Record<JsonErrorKind, string> = {
  'trailing-comma': 'Trailing comma',
  quotes: 'Quotation error',
  brackets: 'Unbalanced brackets',
  'invalid-value': 'Invalid value',
  'missing-comma': 'Missing comma',
  syntax: 'Syntax error',
}

interface ValidationBannerProps {
  result: ProcessingResult
  isProcessing: boolean
}

export function ValidationBanner({ result, isProcessing }: ValidationBannerProps) {
  if (result.empty) {
    return (
      <div className="flex items-start gap-2.5 border-t border-slate-200/80 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
        <Info className="mt-0.5 size-4 shrink-0 text-slate-400" />
        <p>
          Paste JSON, drop a <code className="font-mono text-[11px]">.json</code> file, or load the
          sample. Validation runs automatically as you type.
        </p>
      </div>
    )
  }

  if (result.error) {
    const error = result.error
    return (
      <div className="border-t border-rose-200/70 bg-rose-50/70 px-4 py-3.5 dark:border-rose-400/20 dark:bg-rose-500/[0.07]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
            <AlertTriangle className="size-3.5" />
          </span>
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
            Invalid JSON
          </p>
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            {errorKindLabels[error.kind]}
          </span>
          <span className="text-[11px] font-medium tabular-nums text-rose-600/80 dark:text-rose-300/80">
            Line {error.line}, column {error.column}
          </span>
          {isProcessing && (
            <span className="inline-flex items-center gap-1 text-[10px] text-rose-500/80 dark:text-rose-300/70">
              <Loader2 className="size-3 animate-spin" />
              Rechecking
            </span>
          )}
        </div>

        <p className="mt-2 font-mono text-[11px] leading-5 text-rose-700/90 dark:text-rose-300/80">
          {error.message}
        </p>

        <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-200/70 bg-white/60 px-3 py-2 dark:border-rose-400/15 dark:bg-black/10">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
          <p className="text-xs leading-5 text-rose-800 dark:text-rose-200">{error.suggestion}</p>
        </div>

        <div className="mt-2.5 max-w-full overflow-x-auto rounded-lg border border-rose-200/60 bg-white/70 py-2 font-mono text-[11px] leading-5 dark:border-rose-400/15 dark:bg-black/20">
          <div className="flex min-w-max gap-3 px-3">
            <span className="w-7 shrink-0 select-none text-right text-rose-400">
              {error.line}
            </span>
            <pre className="whitespace-pre text-rose-900/80 dark:text-rose-100/70">
              {error.lineText || ' '}
            </pre>
          </div>
          <div className="flex min-w-max gap-3 px-3">
            <span className="w-7 shrink-0" />
            <pre className="whitespace-pre font-semibold text-rose-500">{error.caret}</pre>
          </div>
        </div>
      </div>
    )
  }

  const stats = result.stats

  return (
    <div className="border-t border-emerald-200/70 bg-emerald-50/60 px-4 py-3 dark:border-emerald-400/15 dark:bg-emerald-500/[0.06]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" />
        </span>
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Valid JSON</p>
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
          <MoveRight className="size-3" />
          Processed in {result.durationMs} ms
        </span>
        {stats && (
          <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tabular-nums text-emerald-700/80 dark:text-emerald-300/80">
            <span>{formatNumber(stats.objects)} objects</span>
            <span>{formatNumber(stats.arrays)} arrays</span>
            <span>{formatNumber(stats.keys)} keys</span>
            <span>depth {formatNumber(stats.depth)}</span>
          </div>
        )}
        {isProcessing && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600/80 dark:text-emerald-300/70">
            <Loader2 className="size-3 animate-spin" />
            Rechecking
          </span>
        )}
      </div>
    </div>
  )
}
