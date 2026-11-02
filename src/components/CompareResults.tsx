import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Info,
  Loader2,
} from 'lucide-react'
import { cx } from '../lib/cx'
import { formatNumber } from '../lib/json/core'
import { MAX_DIFF_ENTRIES, previewValue } from '../lib/json/compare'
import type { DiffKind, JsonCompareResult, JsonDiffEntry } from '../lib/json/compare'

type Filter = 'all' | 'added' | 'removed' | 'changed'

const kindStyles: Record<DiffKind, string> = {
  added: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  removed: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  changed: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  'type-changed': 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
}

const kindLabels: Record<DiffKind, string> = {
  added: 'Added',
  removed: 'Removed',
  changed: 'Changed',
  'type-changed': 'Type',
}

function matchesFilter(entry: JsonDiffEntry, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'changed') return entry.kind === 'changed' || entry.kind === 'type-changed'
  return entry.kind === filter
}

function KindBadge({ entry }: { entry: JsonDiffEntry }) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        kindStyles[entry.kind],
      )}
    >
      {kindLabels[entry.kind]}
    </span>
  )
}

function ValueCell({
  value,
  tone,
}: {
  value: unknown
  tone: 'left' | 'right'
}) {
  const missing = value === undefined

  return (
    <div
      className={cx(
        'min-w-0 rounded-md border px-2 py-1.5 font-mono text-[11px] leading-5',
        missing
          ? 'border-slate-200/70 bg-slate-50/60 text-slate-400 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-500'
          : tone === 'left'
            ? 'border-rose-200/60 bg-rose-50/50 text-rose-800 dark:border-rose-400/15 dark:bg-rose-500/[0.06] dark:text-rose-200'
            : 'border-emerald-200/60 bg-emerald-50/50 text-emerald-800 dark:border-emerald-400/15 dark:bg-emerald-500/[0.06] dark:text-emerald-200',
      )}
    >
      <span className="break-all">{previewValue(value)}</span>
    </div>
  )
}

function DiffRow({ entry }: { entry: JsonDiffEntry }) {
  return (
    <li className="px-3 py-2.5 sm:px-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <KindBadge entry={entry} />
        <code className="min-w-0 break-all font-mono text-[11px] font-medium text-slate-700 dark:text-slate-200">
          {entry.path}
        </code>
        {entry.kind === 'type-changed' && (
          <span className="text-[10px] text-slate-400">
            {entry.leftType} → {entry.rightType}
          </span>
        )}
      </div>
      <div className="mt-1.5 grid gap-1.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <ValueCell value={entry.left} tone="left" />
        <ArrowRight className="mx-auto hidden size-3.5 shrink-0 text-slate-300 dark:text-slate-600 sm:block" />
        <ValueCell value={entry.right} tone="right" />
      </div>
    </li>
  )
}

interface CompareResultsProps {
  result: JsonCompareResult
  isComparing: boolean
}

export function CompareResults({ result, isComparing }: CompareResultsProps) {
  const [filter, setFilter] = useState<Filter>('all')

  if (result.leftError || result.rightError) {
    return (
      <div className="border-t border-rose-200/70 bg-rose-50/70 px-4 py-3.5 dark:border-rose-400/20 dark:bg-rose-500/[0.07]">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
            <AlertTriangle className="size-3.5" />
          </span>
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
            Fix the invalid JSON to compare
          </p>
        </div>
        <ul className="mt-2 space-y-1.5">
          {result.leftError && (
            <li className="text-xs leading-5 text-rose-700 dark:text-rose-300">
              <span className="font-semibold">Original:</span> line {result.leftError.line}, column{' '}
              {result.leftError.column} — {result.leftError.message}
            </li>
          )}
          {result.rightError && (
            <li className="text-xs leading-5 text-rose-700 dark:text-rose-300">
              <span className="font-semibold">Modified:</span> line {result.rightError.line}, column{' '}
              {result.rightError.column} — {result.rightError.message}
            </li>
          )}
        </ul>
      </div>
    )
  }

  if (result.leftEmpty || result.rightEmpty) {
    return (
      <div className="flex items-start gap-2.5 border-t border-slate-200/80 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
        <Info className="mt-0.5 size-4 shrink-0 text-slate-400" />
        <p>
          {result.leftEmpty && result.rightEmpty
            ? 'Paste JSON into both editors or drop a .json file on each side to start comparing.'
            : `Add JSON to the ${result.leftEmpty ? 'Original' : 'Modified'} side to start comparing.`}
        </p>
      </div>
    )
  }

  const visibleEntries = result.entries.filter((entry) => matchesFilter(entry, filter))
  const filters: Array<{ value: Filter; label: string; count: number }> = [
    { value: 'all', label: 'All', count: result.counts.total },
    { value: 'added', label: 'Added', count: result.counts.added },
    { value: 'removed', label: 'Removed', count: result.counts.removed },
    { value: 'changed', label: 'Changed', count: result.counts.changed },
  ]

  if (result.identical) {
    return (
      <div className="border-t border-emerald-200/70 bg-emerald-50/60 px-4 py-4 dark:border-emerald-400/15 dark:bg-emerald-500/[0.06]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              No differences found
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
              Both documents are semantically identical. Compared in {result.durationMs} ms.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-slate-200/80 dark:border-white/10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200/80 bg-slate-50/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.02] sm:px-4">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
            <FileSearch className="size-3.5" />
          </span>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {formatNumber(result.counts.total)} difference
            {result.counts.total === 1 ? '' : 's'}
          </p>
          {isComparing && <Loader2 className="size-3 animate-spin text-slate-400" />}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={cx(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                filter === item.value
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-white/[0.06] dark:text-slate-400 dark:hover:bg-white/[0.1] dark:hover:text-slate-200',
              )}
            >
              {item.label}
              <span className="tabular-nums opacity-70">{item.count}</span>
            </button>
          ))}
        </div>

        <span className="ml-auto text-[10px] tabular-nums text-slate-400">
          {result.durationMs} ms · arrays compared by index
        </span>
      </div>

      {result.truncated && (
        <p className="border-b border-amber-200/70 bg-amber-50/70 px-4 py-2 text-[11px] text-amber-800 dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-200">
          Showing the first {formatNumber(MAX_DIFF_ENTRIES)} differences. Narrow the documents to see
          everything.
        </p>
      )}

      {visibleEntries.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-slate-400">
          No differences match this filter.
        </p>
      ) : (
        <ul className="max-h-[360px] divide-y divide-slate-200/70 overflow-y-auto dark:divide-white/[0.07]">
          {visibleEntries.map((entry) => (
            <DiffRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  )
}
