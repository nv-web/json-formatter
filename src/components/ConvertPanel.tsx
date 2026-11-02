import { useRef, useState } from 'react'
import {
  ClipboardCopy,
  Download,
  Eraser,
  FileJson,
  FileSpreadsheet,
  Upload,
  UploadCloud,
} from 'lucide-react'
import { cx } from '../lib/cx'
import { formatBytes, formatNumber } from '../lib/json/core'
import { countLines } from '../lib/json/file'
import { IconButton } from './ui/IconButton'
import { StatusPill } from './ui/StatusPill'
import { JsonEditor } from './JsonEditor'
import type { ValidationState } from '../types/ui'

interface ConvertPanelProps {
  title: string
  tone: 'input' | 'output'
  value: string
  dark: boolean
  language: 'json' | 'text'
  readOnly?: boolean
  placeholder?: string
  status?: ValidationState
  errorLine?: number | null
  fileName?: string | null
  fileSize?: number | null
  onChange?: (value: string) => void
  onFile?: (file: File) => void
  onClear?: () => void
  onLoadSample?: () => void
  onCopy?: () => void
  onDownload?: () => void
  canCopy?: boolean
  canDownload?: boolean
}

const accents = {
  input: {
    dot: 'bg-teal-500',
    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300',
    overlay: 'border-teal-400 bg-teal-50/90 dark:border-teal-400/60 dark:bg-[#0b1020]/90',
    overlayText: 'text-teal-700 dark:text-teal-300',
    overlaySub: 'text-teal-600/80 dark:text-teal-400',
  },
  output: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    overlay: '',
    overlayText: '',
    overlaySub: '',
  },
} as const

export function ConvertPanel({
  title,
  tone,
  value,
  dark,
  language,
  readOnly = false,
  placeholder,
  status = 'empty',
  errorLine = null,
  fileName = null,
  fileSize = null,
  onChange,
  onFile,
  onClear,
  onLoadSample,
  onCopy,
  onDownload,
  canCopy = false,
  canDownload = false,
}: ConvertPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)
  const accent = accents[tone]
  const lineCount = countLines(value)
  const FileIcon = language === 'json' ? FileJson : FileSpreadsheet

  const accept = language === 'json' ? '.json,application/json,text/plain' : '.csv,.tsv,.txt,text/csv,text/plain'

  return (
    <section
      aria-label={`${title} editor`}
      className={cx(
        'relative flex min-w-0 flex-col',
        tone === 'input' && 'lg:border-r lg:border-slate-200/80 dark:lg:border-white/10',
      )}
      onDragEnter={(event) => {
        if (!onFile) return
        event.preventDefault()
        dragDepth.current += 1
        setDragging(true)
      }}
      onDragOver={(event) => {
        if (!onFile) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={() => {
        if (!onFile) return
        dragDepth.current -= 1
        if (dragDepth.current <= 0) {
          dragDepth.current = 0
          setDragging(false)
        }
      }}
      onDrop={(event) => {
        if (!onFile) return
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
          <h2 className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {title}
          </h2>
          <span
            className={cx(
              'hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex',
              accent.badge,
            )}
          >
            {tone === 'input' ? 'Source' : 'Result'}
          </span>
          {tone === 'input' && <StatusPill state={status} />}
        </div>

        <div className="flex items-center gap-1">
          {onFile && (
            <IconButton label={`Upload ${title} file`} onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" />
            </IconButton>
          )}
          {onClear && (
            <IconButton
              label={`Clear ${title}`}
              onClick={onClear}
              disabled={value.length === 0}
              className="hover:text-rose-600 dark:hover:text-rose-400"
            >
              <Eraser className="size-4" />
            </IconButton>
          )}
          {onCopy && (
            <IconButton
              label="Copy result"
              onClick={onCopy}
              disabled={!canCopy}
              tooltipSide="bottom"
            >
              <ClipboardCopy className="size-4" />
            </IconButton>
          )}
          {onDownload && (
            <IconButton
              label="Download result file"
              onClick={onDownload}
              disabled={!canDownload}
              tooltipSide="bottom"
            >
              <Download className="size-4" />
            </IconButton>
          )}
          {onFile && (
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="sr-only"
              aria-label={`Choose ${title} file`}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onFile(file)
                event.target.value = ''
              }}
            />
          )}
        </div>
      </div>

      <div className="h-[340px] min-h-0 bg-white/40 dark:bg-transparent sm:h-[400px] xl:h-[440px]">
        <JsonEditor
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          dark={dark}
          language={language}
          errorLine={errorLine}
          ariaLabel={`${title} editor`}
          placeholder={placeholder}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-slate-200/80 px-3 py-2 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
        <div className="flex min-w-0 items-center gap-2">
          {fileName ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
              <FileIcon className="size-3.5 shrink-0 text-teal-500" />
              <span className="max-w-[120px] truncate font-medium sm:max-w-[190px]">{fileName}</span>
              {fileSize != null && (
                <span className="shrink-0 text-slate-400 dark:text-slate-500">
                  {formatBytes(fileSize)}
                </span>
              )}
            </span>
          ) : onFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hidden items-center gap-1.5 rounded transition-colors hover:text-teal-600 dark:hover:text-teal-400 sm:inline-flex"
            >
              <UploadCloud className="size-3.5" />
              Drop a file or browse
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
              <FileIcon className="size-3.5" />
              Read-only output
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 tabular-nums">
          {onLoadSample && (
            <button
              type="button"
              onClick={onLoadSample}
              className="rounded text-teal-600 transition-colors hover:text-teal-500 hover:underline dark:text-teal-400 dark:hover:text-teal-300"
            >
              Load sample
            </button>
          )}
          <span>{formatNumber(value.length)} chars</span>
          <span className="h-3 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />
          <span>
            {formatNumber(lineCount)} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>
      </div>

      {onFile && dragging && (
        <div
          className={cx(
            'pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed backdrop-blur-sm',
            accent.overlay,
          )}
        >
          <div className={cx('flex flex-col items-center gap-2', accent.overlayText)}>
            <UploadCloud className="size-9" />
            <p className="text-sm font-semibold">Drop your file</p>
            <p className={cx('text-xs', accent.overlaySub)}>
              {language === 'json' ? '.json only' : '.csv or .tsv'} · processed locally
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
