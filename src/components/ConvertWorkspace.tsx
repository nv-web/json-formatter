import { useDeferredValue, useMemo } from 'react'
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { ConvertPanel } from './ConvertPanel'
import { Segmented } from './ui/Segmented'
import { cx } from '../lib/cx'
import { csvToJson, jsonToCsv } from '../lib/json/csv'
import { formatBytes, formatNumber } from '../lib/json/core'
import { copyText, downloadText, sanitizeDownloadName } from '../lib/json/file'
import type { ConversionDirection, Delimiter } from '../lib/json/csv'
import type { ConverterState } from '../hooks/useConverter'
import type { ToastTone } from '../types/ui'

const directionOptions = [
  {
    value: 'csv-to-json' as ConversionDirection,
    label: 'CSV → JSON',
    title: 'Convert CSV to JSON',
  },
  {
    value: 'json-to-csv' as ConversionDirection,
    label: 'JSON → CSV',
    title: 'Convert JSON to CSV',
  },
]

const delimiterOptions = [
  { value: ',' as Delimiter, label: ',', title: 'Comma separator' },
  { value: ';' as Delimiter, label: ';', title: 'Semicolon separator' },
  { value: '\t' as Delimiter, label: 'Tab', title: 'Tab separator' },
  { value: '|' as Delimiter, label: '|', title: 'Pipe separator' },
]

interface OptionToggleProps {
  active: boolean
  label: string
  onClick: () => void
}

function OptionToggle({ active, label, onClick }: OptionToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'inline-flex h-7 items-center rounded-lg border px-2 text-[11px] font-medium transition-colors duration-150',
        active
          ? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-400/25 dark:bg-teal-500/15 dark:text-teal-300'
          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-slate-200',
      )}
    >
      {label}
    </button>
  )
}

interface ConvertWorkspaceProps {
  dark: boolean
  converter: ConverterState
  onNotify: (message: string, tone?: ToastTone) => void
}

export function ConvertWorkspace({ dark, converter, onNotify }: ConvertWorkspaceProps) {
  const {
    direction,
    input,
    fileName,
    fileSize,
    delimiter,
    hasHeader,
    inferTypes,
    includeHeader,
    setDirection,
    setInput,
    replaceInput,
    setDelimiter,
    setHasHeader,
    setInferTypes,
    setIncludeHeader,
    loadFile,
    loadSample,
    clear,
  } = converter

  const deferredInput = useDeferredValue(input)
  const isConverting = deferredInput !== input

  const result = useMemo(
    () =>
      direction === 'csv-to-json'
        ? csvToJson(deferredInput, { delimiter, hasHeader, inferTypes })
        : jsonToCsv(deferredInput, { delimiter, includeHeader }),
    [deferredInput, direction, delimiter, hasHeader, inferTypes, includeHeader],
  )

  const hasOutput = result.ok && !result.empty && result.output.length > 0
  const inputLanguage = direction === 'csv-to-json' ? 'text' : 'json'
  const outputLanguage = direction === 'csv-to-json' ? 'json' : 'text'
  const inputTitle = direction === 'csv-to-json' ? 'CSV input' : 'JSON input'
  const outputTitle = direction === 'csv-to-json' ? 'JSON output' : 'CSV output'
  const status = result.empty ? 'empty' : result.ok ? 'valid' : 'invalid'

  const handleCopy = async () => {
    if (!hasOutput) return

    try {
      await copyText(result.output)
      onNotify(`Copied ${direction === 'csv-to-json' ? 'JSON' : 'CSV'} output.`, 'success')
    } catch {
      onNotify('Clipboard access was blocked by the browser. Copy the output manually.', 'error')
    }
  }

  const handleDownload = () => {
    if (!hasOutput) return

    const base = fileName ? fileName.replace(/\.[^./\\]+$/, '') : 'converted'
    const extension = direction === 'csv-to-json' ? 'json' : 'csv'
    const name = sanitizeDownloadName(`${base}.${extension}`, `converted.${extension}`)
    const mimeType =
      direction === 'csv-to-json'
        ? 'application/json;charset=utf-8'
        : 'text/csv;charset=utf-8'

    downloadText(result.output, name, mimeType)
    onNotify(`Downloaded ${name}.`, 'success')
  }

  const handleSwap = () => {
    if (result.ok && result.output.length > 0) {
      replaceInput(result.output)
      onNotify('Moved the result into the input. Direction swapped.', 'info')
    } else {
      onNotify('Direction swapped.', 'info')
    }

    setDirection(direction === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json')
  }

  return (
    <section
      id="convert"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-10 sm:px-6 lg:px-8"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="section-label">
            <FileSpreadsheet className="size-3.5" />
            Convert
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[1.7rem]">
            Convert CSV and JSON
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Turn CSV rows into JSON objects, or flatten JSON into CSV — with configurable
            delimiters, headers, and automatic type inference.
          </p>
        </div>

        <button type="button" onClick={handleSwap} className="btn-secondary h-8 px-3 text-xs">
          <ArrowLeftRight className="size-3.5" />
          Swap direction
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200/80 bg-slate-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.02]">
          <Segmented
            ariaLabel="Conversion direction"
            value={direction}
            options={directionOptions}
            onChange={setDirection}
          />

          <span className="hidden h-5 w-px bg-slate-200 dark:bg-white/10 lg:block" aria-hidden="true" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Delimiter
            </span>
            <Segmented
              ariaLabel="Delimiter"
              value={delimiter}
              options={delimiterOptions}
              onChange={setDelimiter}
            />
          </div>

          <div className="flex items-center gap-1">
            {direction === 'csv-to-json' ? (
              <>
                <OptionToggle
                  active={hasHeader}
                  label="First row is header"
                  onClick={() => setHasHeader(!hasHeader)}
                />
                <OptionToggle
                  active={inferTypes}
                  label="Infer types"
                  onClick={() => setInferTypes(!inferTypes)}
                />
              </>
            ) : (
              <OptionToggle
                active={includeHeader}
                label="Include header row"
                onClick={() => setIncludeHeader(!includeHeader)}
              />
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {isConverting && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                <Loader2 className="size-3 animate-spin" />
                Converting
              </span>
            )}
            <button
              type="button"
              onClick={loadSample}
              className="btn-secondary h-7 px-2.5 text-[11px]"
            >
              <Sparkles className="size-3" />
              Sample
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2">
          <ConvertPanel
            title={inputTitle}
            tone="input"
            value={input}
            dark={dark}
            language={inputLanguage}
            status={status}
            errorLine={result.jsonError?.line ?? null}
            fileName={fileName}
            fileSize={fileSize}
            placeholder={
              direction === 'csv-to-json'
                ? 'Paste CSV here, drop a .csv file, or use the sample…'
                : 'Paste JSON here, drop a .json file, or use the sample…'
            }
            onChange={setInput}
            onFile={(file) => void loadFile(file)}
            onClear={clear}
            onLoadSample={loadSample}
          />
          <ConvertPanel
            title={outputTitle}
            tone="output"
            value={result.output}
            dark={dark}
            language={outputLanguage}
            readOnly
            placeholder="Converted output will appear here…"
            onCopy={handleCopy}
            onDownload={handleDownload}
            canCopy={hasOutput}
            canDownload={hasOutput}
          />
        </div>

        {result.empty ? (
          <div className="flex items-start gap-2.5 border-t border-slate-200/80 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
            <Info className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <p>
              Paste {direction === 'csv-to-json' ? 'CSV' : 'JSON'} or drop a file to start
              converting. Changes apply automatically.
            </p>
          </div>
        ) : !result.ok ? (
          <div className="border-t border-rose-200/70 bg-rose-50/70 px-4 py-3.5 dark:border-rose-400/20 dark:bg-rose-500/[0.07]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                <AlertTriangle className="size-3.5" />
              </span>
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
                Conversion failed
              </p>
              {result.jsonError && (
                <span className="text-[11px] font-medium tabular-nums text-rose-600/80 dark:text-rose-300/80">
                  Line {result.jsonError.line}, column {result.jsonError.column}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs leading-5 text-rose-700 dark:text-rose-300">
              {result.error}
            </p>
          </div>
        ) : (
          <div className="border-t border-emerald-200/70 bg-emerald-50/60 px-4 py-3 dark:border-emerald-400/15 dark:bg-emerald-500/[0.06]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
              </span>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Converted successfully
              </p>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                {formatNumber(result.records)} records · {formatNumber(result.columns)} columns
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tabular-nums text-emerald-700/80 dark:text-emerald-300/80">
                <span>{formatBytes(result.outputBytes)} output</span>
                <span>{result.durationMs} ms</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="size-3.5 text-emerald-500" />
        Conversion happens entirely in your browser. Nothing is uploaded.
      </p>
    </section>
  )
}
