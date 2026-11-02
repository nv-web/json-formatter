import {
  AlignJustify,
  ArrowDownAZ,
  Braces,
  Minimize2,
  RotateCcw,
  Rows3,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { cx } from '../lib/cx'
import { Segmented } from './ui/Segmented'
import { Tooltip } from './ui/Tooltip'
import { IconButton } from './ui/IconButton'
import type { FormatOptions, IndentStyle } from '../types/json'
import type { OutputMode } from '../types/ui'

interface FormatToolbarProps {
  options: FormatOptions
  onOptionsChange: (options: FormatOptions) => void
  viewMode: OutputMode
  onFormat: () => void
  onMinify: () => void
  onValidate: () => void
  onReset: () => void
  canReset: boolean
}

interface ToggleChipProps {
  active: boolean
  onClick: () => void
  icon: typeof Braces
  label: string
  description: string
}

function ToggleChip({ active, onClick, icon: Icon, label, description }: ToggleChipProps) {
  return (
    <Tooltip label={description}>
      <button
        type="button"
        aria-pressed={active}
        aria-label={description}
        onClick={onClick}
        className={cx(
          'inline-flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500',
          active
            ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-500/15 dark:text-violet-300'
            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-slate-200',
        )}
      >
        <Icon className="size-3.5" />
        <span>{label}</span>
      </button>
    </Tooltip>
  )
}

const indentOptions = [
  { value: '2' as IndentStyle, label: '2', title: 'Indent with 2 spaces' },
  { value: '4' as IndentStyle, label: '4', title: 'Indent with 4 spaces' },
  { value: '8' as IndentStyle, label: '8', title: 'Indent with 8 spaces' },
  { value: 'tab' as IndentStyle, label: 'Tab', title: 'Indent with a tab character' },
]

export function FormatToolbar({
  options,
  onOptionsChange,
  viewMode,
  onFormat,
  onMinify,
  onValidate,
  onReset,
  canReset,
}: FormatToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200/80 bg-slate-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Indent
        </span>
        <Segmented
          ariaLabel="Indentation style"
          value={options.indent}
          options={indentOptions}
          onChange={(indent) => onOptionsChange({ ...options, indent })}
        />
      </div>

      <span className="hidden h-5 w-px bg-slate-200 dark:bg-white/10 lg:block" aria-hidden="true" />

      <div className="flex items-center gap-1">
        <ToggleChip
          active={options.sortKeys}
          onClick={() => onOptionsChange({ ...options, sortKeys: !options.sortKeys })}
          icon={ArrowDownAZ}
          label="Sort keys"
          description="Sort object keys alphabetically at every level"
        />
        <ToggleChip
          active={options.prettyNested}
          onClick={() => onOptionsChange({ ...options, prettyNested: !options.prettyNested })}
          icon={Braces}
          label="Pretty nested"
          description="Pretty-print nested objects and arrays"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Arrays
        </span>
        <Segmented
          ariaLabel="Array layout"
          value={options.arrayLayout}
          options={[
            { value: 'expand', label: <Rows3 className="size-3.5" />, title: 'Expand arrays across multiple lines' },
            { value: 'compact', label: <AlignJustify className="size-3.5" />, title: 'Keep primitive arrays on one line' },
          ]}
          onChange={(arrayLayout) => onOptionsChange({ ...options, arrayLayout })}
        />
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <Tooltip label="Pretty-print with the selected options">
          <button
            type="button"
            onClick={onFormat}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors duration-150',
              viewMode === 'formatted'
                ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-500/15 dark:text-violet-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]',
            )}
          >
            <Sparkles className="size-3.5" />
            <span>Format</span>
          </button>
        </Tooltip>

        <Tooltip label="Remove all unnecessary whitespace">
          <button
            type="button"
            onClick={onMinify}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors duration-150',
              viewMode === 'minified'
                ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-500/15 dark:text-violet-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]',
            )}
          >
            <Minimize2 className="size-3.5" />
            <span>Minify</span>
          </button>
        </Tooltip>

        <button type="button" onClick={onValidate} className="btn-primary h-8 px-3 text-xs">
          <ShieldCheck className="size-3.5" />
          Validate
        </button>

        <IconButton label="Reset the workspace" onClick={onReset} disabled={!canReset}>
          <RotateCcw className="size-4" />
        </IconButton>
      </div>
    </div>
  )
}
