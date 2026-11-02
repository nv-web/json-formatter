import { useRef, useState } from 'react'
import { Eraser, FileJson, Upload, UploadCloud } from 'lucide-react'
import { cx } from '../lib/cx'
import { formatBytes, formatNumber } from '../lib/json/core'
import { countLines } from '../lib/json/file'
import { IconButton } from './ui/IconButton'
import { StatusPill } from './ui/StatusPill'
import { JsonEditor } from './JsonEditor'
import type { ValidationState } from '../types/ui'

interface ComparePanelProps {
  side: 'left' | 'right'
  title: string
  value: string
  onChange: (value: string) => void
  dark: boolean
  errorLine: number | null
  validationState: ValidationState
  fileName: string | null
  fileSize: number | null
  onFile: (file: File) => void
  onClear: () => void
  onLoadSample: () => void
}

const accents = {
  left: {
    dot: 'bg-violet-500',
    border: 'lg:border-r lg:border-slate-200/80 dark:lg:border-white/10',
    overlay: 'border-violet-400 bg-violet-50/90 dark:border-violet-400/60 dark:bg-[#0b1020]/90',
    overlayText: 'text-violet-700 dark:text-violet-300',
    overlaySub: 'text-violet-600/80 dark:text-violet-400',
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
    label: 'Original',
  },
  right: {
    dot: 'bg-sky-500',
    border: '',
    overlay: 'border-sky-400 bg-sky-50/90 dark:border-sky-400/60 dark:bg-[#0b1020]/90',
    overlayText: 'text-sky-700 dark:text-sky-300',
    overlaySub: 'text-sky-600/80 dark:text-sky-400',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    label: 'Modified',
  },
} as const

export function ComparePanel({
  side,
  title,
  value,
  onChange,
  dark,
  errorLine,
  validationState,
  fileName,
  fileSize,
  onFile,
  onClear,
  onLoadSample,
}: ComparePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)
  const accent = accents[side]
  const lineCount = countLines(value)

  return (
    <section
      aria-label={`${title} JSON`}
      className={cx('relative flex min-w-0 flex-col', accent.border)}
      onDragEnter={(event) => {
        event.preventDefault()
        dragDepth.current += 1
        setDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={() => {
        dragDepth.current -= 1
        if (dragDepth.current <= 0) {
          dragDepth.current = 0
          setDragging(false)
        }
      }}
      onDrop={(event) => {
        event.preventDefault()
        dragDepth.current = 0
        setDragging(false)
        const file = event.dataTransfer.files?.[0]
        if (file) onFile(file)
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 px-3 py-2.5 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cx('size-1.5 shrink-0 rounded-full', accent.dot)} aria-hidden="true" />
          <h3 className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {title}
          </h3>
          <span
            className={cx(
              'hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex',
              accent.badge,
            )}
          >
            {accent.label}
          </span>
          <StatusPill state={validationState} />
        </div>

        <div className="flex items-center gap-1">
          <IconButton label={`Upload ${title} JSON file`} onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
          </IconButton>
          <IconButton
            label={`Clear ${title} JSON`}
            onClick={onClear}
            disabled={value.length === 0}
            className="hover:text-rose-600 dark:hover:text-rose-400"
          >
            <Eraser className="size-4" />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json,text/plain"
            className="sr-only"
            aria-label={`Choose ${title} JSON file`}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onFile(file)
              event.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="h-[300px] min-h-0 bg-white/40 dark:bg-transparent sm:h-[360px] xl:h-[420px]">
        <JsonEditor
          value={value}
          onChange={onChange}
          dark={dark}
          errorLine={errorLine}
          ariaLabel={`${title} JSON editor`}
          placeholder={'Paste JSON here or drop a .json file…'}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-slate-200/80 px-3 py-2 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
        <div className="flex min-w-0 items-center gap-2">
          {fileName ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
              <FileJson className={cx('size-3.5 shrink-0', side === 'left' ? 'text-violet-500' : 'text-sky-500')} />
              <span className="max-w-[120px] truncate font-medium sm:max-w-[180px]">{fileName}</span>
              {fileSize != null && (
                <span className="shrink-0 text-slate-400 dark:text-slate-500">
                  {formatBytes(fileSize)}
                </span>
              )}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hidden items-center gap-1.5 rounded transition-colors hover:text-violet-600 dark:hover:text-violet-400 sm:inline-flex"
            >
              <UploadCloud className="size-3.5" />
              Drop a .json file or browse
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 tabular-nums">
          <button
            type="button"
            onClick={onLoadSample}
            className="rounded text-violet-600 transition-colors hover:text-violet-500 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
          >
            Load sample
          </button>
          <span>{formatNumber(value.length)} chars</span>
          <span className="h-3 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />
          <span>
            {formatNumber(lineCount)} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>
      </div>

      {dragging && (
        <div
          className={cx(
            'pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed backdrop-blur-sm',
            accent.overlay,
          )}
        >
          <div className={cx('flex flex-col items-center gap-2', accent.overlayText)}>
            <UploadCloud className="size-9" />
            <p className="text-sm font-semibold">Drop {title} JSON</p>
            <p className={cx('text-xs', accent.overlaySub)}>.json only · processed locally</p>
          </div>
        </div>
      )}
    </section>
  )
}
