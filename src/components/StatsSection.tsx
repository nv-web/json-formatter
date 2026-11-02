import {
  Braces,
  Brackets,
  HardDrive,
  KeyRound,
  Layers,
  ListOrdered,
  Loader2,
  Sigma,
  Type,
} from 'lucide-react'
import { formatBytes, formatNumber } from '../lib/json/core'
import type { JsonStats } from '../types/json'

interface StatsSectionProps {
  stats: JsonStats | null
  durationMs: number
  isProcessing: boolean
}

const tones = {
  violet:
    'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  emerald:
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300',
} as const

interface StatCardProps {
  icon: typeof HardDrive
  label: string
  value: string
  hint: string
  tone: keyof typeof tones
}

function StatCard({ icon: Icon, label, value, hint, tone }: StatCardProps) {
  return (
    <div className="card group p-4 transition-colors duration-200 hover:border-slate-300 dark:hover:border-white/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 truncate text-[1.35rem] font-semibold leading-none tracking-tight tabular-nums text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>
    </div>
  )
}

export function StatsSection({ stats, durationMs, isProcessing }: StatsSectionProps) {
  const empty = stats === null
  const values = stats
    ? stats.strings + stats.numbers + stats.booleans + stats.nulls
    : 0

  const cards: StatCardProps[] = [
    {
      icon: HardDrive,
      label: 'File size',
      value: stats ? formatBytes(stats.bytes) : '—',
      hint: stats ? `${formatNumber(stats.characters)} UTF-16 units` : 'No JSON loaded',
      tone: 'violet',
    },
    {
      icon: Type,
      label: 'Characters',
      value: stats ? formatNumber(stats.characters) : '—',
      hint: 'Including whitespace',
      tone: 'sky',
    },
    {
      icon: ListOrdered,
      label: 'Lines',
      value: stats ? formatNumber(stats.lines) : '—',
      hint: 'Logical line count',
      tone: 'slate',
    },
    {
      icon: Braces,
      label: 'Objects',
      value: stats ? formatNumber(stats.objects) : '—',
      hint: 'All nested objects',
      tone: 'violet',
    },
    {
      icon: Brackets,
      label: 'Arrays',
      value: stats ? formatNumber(stats.arrays) : '—',
      hint: 'All nested arrays',
      tone: 'sky',
    },
    {
      icon: KeyRound,
      label: 'Keys',
      value: stats ? formatNumber(stats.keys) : '—',
      hint: 'Unique property entries',
      tone: 'emerald',
    },
    {
      icon: Layers,
      label: 'Max depth',
      value: stats ? formatNumber(stats.depth) : '—',
      hint: 'Nesting levels',
      tone: 'amber',
    },
    {
      icon: Sigma,
      label: 'Primitive values',
      value: stats ? formatNumber(values) : '—',
      hint: stats
        ? `${formatNumber(stats.strings)} strings · ${formatNumber(stats.numbers)} numbers`
        : 'Strings, numbers, booleans, null',
      tone: 'rose',
    },
  ]

  return (
    <section id="stats" className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="section-label">Insights</span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[1.7rem]">
            JSON statistics
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            A structural snapshot of your document, computed in the browser.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {isProcessing ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin text-violet-500" />
              Recalculating
            </span>
          ) : stats ? (
            <span>Computed in {durationMs} ms</span>
          ) : (
            <span>Waiting for valid JSON</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {empty && (
        <p className="mt-3 text-[11px] text-slate-400">
          Statistics populate automatically once your input is valid JSON.
        </p>
      )}
    </section>
  )
}
