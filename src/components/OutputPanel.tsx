import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ClipboardCopy,
  Download,
  FileJson,
  Loader2,
  Minimize2,
  Sparkles,
} from 'lucide-react'
import { cx } from '../lib/cx'
import { formatBytes } from '../lib/json/core'
import { IconButton } from './ui/IconButton'
import { JsonEditor } from './JsonEditor'
import type { ProcessingResult } from '../types/json'
import type { OutputMode } from '../types/ui'

interface OutputPanelProps {
  result: ProcessingResult
  viewMode: OutputMode
  isProcessing: boolean
  dark: boolean
  filename: string
  onFilenameChange: (value: string) => void
  onCopy: (mode: OutputMode) => void
  onDownload: () => void
  onLoadSample: () => void
}

export function OutputPanel({
  result,
  viewMode,
  isProcessing,
  dark,
  filename,
  onFilenameChange,
  onCopy,
  onDownload,
  onLoadSample,
}: OutputPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const hasOutput = result.ok && !result.empty
  const activeBytes = viewMode === 'formatted' ? result.formattedBytes : result.minifiedBytes
  const output = viewMode === 'formatted' ? result.formatted : result.minified

  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <section
      aria-label="Formatted JSON output"
      className="relative flex min-w-0 flex-col border-t border-slate-200/80 dark:border-white/10 lg:border-l lg:border-t-0"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 px-3 py-2.5 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cx(
              'size-1.5 shrink-0 rounded-full',
              hasOutput ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600',
            )}
            aria-hidden="true"
          />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Output
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
            {viewMode === 'formatted' ? (
              <Sparkles className="size-3" />
            ) : (
              <Minimize2 className="size-3" />
            )}
            {viewMode === 'formatted' ? 'Formatted' : 'Minified'}
          </span>
          {hasOutput && (
            <span className="shrink-0 whitespace-nowrap text-[10px] tabular-nums text-slate-400">
              {formatBytes(activeBytes)}
              {viewMode === 'minified' && result.reduction > 0 && (
                <span className="ml-1 hidden font-medium text-emerald-600 dark:text-emerald-400 sm:inline">
                  −{result.reduction}%
                </span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isProcessing && (
            <span
              className="mr-1 inline-flex items-center gap-1 text-[10px] text-slate-400"
              title="Processing JSON in a Web Worker"
            >
              <Loader2 className="size-3 animate-spin" />
              <span className="hidden md:inline">Processing</span>
            </span>
          )}

          <div ref={menuRef} className="relative">
            <div className="flex">
              <button
                type="button"
                onClick={() => onCopy(viewMode)}
                disabled={!hasOutput}
                className="inline-flex h-8 items-center gap-1.5 rounded-l-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]"
              >
                <ClipboardCopy className="size-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                disabled={!hasOutput}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Copy options"
                className="inline-flex h-8 items-center rounded-r-lg border border-l-0 border-slate-200 bg-white px-1.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.08]"
              >
                <ChevronDown className={cx('size-3.5 transition-transform', menuOpen && 'rotate-180')} />
              </button>
            </div>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-[#0d1420] dark:shadow-black/40"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onCopy('formatted')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="size-3.5 text-violet-500" />
                    Copy formatted
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatBytes(result.formattedBytes)}
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onCopy('minified')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Minimize2 className="size-3.5 text-sky-500" />
                    Copy minified
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatBytes(result.minifiedBytes)}
                  </span>
                </button>
              </div>
            )}
          </div>

          <IconButton
            label="Download JSON file"
            onClick={onDownload}
            disabled={!hasOutput}
            tooltipSide="bottom"
          >
            <Download className="size-4" />
          </IconButton>
        </div>
      </div>

      <div className="h-[360px] min-h-0 bg-slate-50/40 dark:bg-transparent sm:h-[400px] xl:h-[460px]">
        {hasOutput ? (
          <JsonEditor
            value={output}
            readOnly
            dark={dark}
            ariaLabel="Formatted JSON output"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            {isProcessing ? (
              <>
                <Loader2 className="size-7 animate-spin text-violet-500" />
                <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  Formatting JSON…
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Running in a Web Worker so the interface stays responsive.
                </p>
              </>
            ) : result.error ? (
              <>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
                  <AlertTriangle className="size-5" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Output unavailable
                </p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Fix the syntax error on line {result.error.line}, column {result.error.column} to
                  generate formatted JSON.
                </p>
              </>
            ) : (
              <>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-slate-500">
                  <FileJson className="size-5" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Your formatted JSON will appear here
                </p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Paste JSON, drop a file, or start with a sample to explore the workspace.
                </p>
                <button type="button" onClick={onLoadSample} className="btn-secondary mt-4 h-8 px-3 text-xs">
                  <Check className="size-3.5" />
                  Load sample JSON
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/80 px-3 py-2 dark:border-white/10">
        <label className="flex min-w-0 flex-1 items-center gap-1.5">
          <FileJson className="size-3.5 shrink-0 text-slate-400" />
          <span className="sr-only">Download filename</span>
          <input
            value={filename}
            onChange={(event) => onFilenameChange(event.target.value)}
            spellCheck={false}
            aria-label="Download filename"
            className="h-7 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 font-mono text-[11px] text-slate-500 outline-none transition-colors hover:border-slate-200 focus:border-violet-300 focus:bg-white focus:text-slate-800 dark:text-slate-400 dark:hover:border-white/10 dark:focus:border-violet-400/40 dark:focus:bg-white/[0.04] dark:focus:text-slate-200"
          />
        </label>
        <button
          type="button"
          onClick={onDownload}
          disabled={!hasOutput}
          className="btn-secondary h-7 px-2.5 text-[11px]"
        >
          <Download className="size-3" />
          Download .json
        </button>
      </div>
    </section>
  )
}
