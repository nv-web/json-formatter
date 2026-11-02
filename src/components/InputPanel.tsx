import { useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eraser,
  FileJson,
  Loader2,
  Upload,
  UploadCloud,
} from 'lucide-react'
import { cx } from '../lib/cx'
import { formatBytes, formatNumber } from '../lib/json/core'
import { countLines } from '../lib/json/file'
import { IconButton } from './ui/IconButton'
import { JsonEditor } from './JsonEditor'

export type ValidationState = 'empty' | 'valid' | 'invalid'

interface InputPanelProps {
  value: string
  onChange: (value: string) => void
  dark: boolean
  errorLine: number | null
  validationState: ValidationState
  isProcessing: boolean
  fileName: string | null
  fileSize: number | null
  onFile: (file: File) => void
  onClear: () => void
  onLoadSample: () => void
}

function StatusPill({
  state,
  isProcessing,
}: {
  state: ValidationState
  isProcessing: boolean
}) {
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

export function InputPanel({
  value,
  onChange,
  dark,
  errorLine,
  validationState,
  isProcessing,
  fileName,
  fileSize,
  onFile,
  onClear,
  onLoadSample,
}: InputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)
  const lineCount = countLines(value)

  return (
    <section
      id="input-panel"
      aria-label="JSON input"
      className="relative flex min-w-0 flex-col"
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
          <span
            className={cx(
              'size-1.5 shrink-0 rounded-full',
              validationState === 'valid' && 'bg-emerald-500',
              validationState === 'invalid' && 'bg-rose-500',
              validationState === 'empty' && 'bg-slate-300 dark:bg-slate-600',
            )}
            aria-hidden="true"
          />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Input
          </h2>
          <StatusPill state={validationState} isProcessing={isProcessing} />
        </div>

        <div className="flex items-center gap-1">
          <IconButton label="Upload a JSON file" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
          </IconButton>
          <IconButton
            label="Clear input"
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
            aria-label="Choose a JSON file"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onFile(file)
              event.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="h-[360px] min-h-0 bg-white/40 dark:bg-transparent sm:h-[400px] xl:h-[460px]">
        <JsonEditor
          value={value}
          onChange={onChange}
          dark={dark}
          errorLine={errorLine}
          ariaLabel="JSON input editor"
          placeholder={'Paste JSON here, drop a .json file, or use the sample…'}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-slate-200/80 px-3 py-2 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
        <div className="flex min-w-0 items-center gap-2">
          {fileName ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
              <FileJson className="size-3.5 shrink-0 text-violet-500" />
              <span className="max-w-[150px] truncate font-medium sm:max-w-[220px]">{fileName}</span>
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
          <span>{formatNumber(lineCount)} {lineCount === 1 ? 'line' : 'lines'}</span>
        </div>
      </div>

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-violet-400 bg-violet-50/90 backdrop-blur-sm dark:border-violet-400/60 dark:bg-[#0b1020]/90">
          <div className="flex flex-col items-center gap-2 text-violet-700 dark:text-violet-300">
            <UploadCloud className="size-9" />
            <p className="text-sm font-semibold">Drop your JSON file</p>
            <p className="text-xs text-violet-600/80 dark:text-violet-400">
              .json only · processed locally
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
