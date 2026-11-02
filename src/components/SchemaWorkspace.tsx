import { useDeferredValue, useMemo } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wand2,
} from 'lucide-react'
import { ConvertPanel } from './ConvertPanel'
import { Segmented } from './ui/Segmented'
import { cx } from '../lib/cx'
import { formatBytes } from '../lib/json/core'
import { copyText, downloadText, sanitizeDownloadName } from '../lib/json/file'
import { generateFromSchema } from '../lib/json/schema'
import type { SchemaGeneratorState } from '../hooks/useSchemaGenerator'
import type { ToastTone } from '../types/ui'

const countOptions = [
  { value: '1', label: '1', title: 'Generate one example' },
  { value: '3', label: '3', title: 'Generate three examples' },
  { value: '5', label: '5', title: 'Generate five examples' },
  { value: '10', label: '10', title: 'Generate ten examples' },
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

interface SchemaWorkspaceProps {
  dark: boolean
  generator: SchemaGeneratorState
  onNotify: (message: string, tone?: ToastTone) => void
}

export function SchemaWorkspace({ dark, generator, onNotify }: SchemaWorkspaceProps) {
  const {
    schemaText,
    fileName,
    fileSize,
    count,
    includeOptional,
    seed,
    setSchemaText,
    setCount,
    setIncludeOptional,
    regenerate,
    loadFile,
    loadSample,
    loadDocumentSample,
    clear,
  } = generator

  const deferredSchema = useDeferredValue(schemaText)
  const isGenerating = deferredSchema !== schemaText

  const result = useMemo(
    () =>
      generateFromSchema(deferredSchema, {
        count,
        includeOptional,
        seed,
      }),
    [deferredSchema, count, includeOptional, seed],
  )

  const hasOutput = result.ok && !result.empty && result.output.length > 0
  const status = result.empty ? 'empty' : result.ok ? 'valid' : 'invalid'

  const handleCopy = async () => {
    if (!hasOutput) return

    try {
      await copyText(result.output)
      onNotify('Copied generated JSON.', 'success')
    } catch {
      onNotify('Clipboard access was blocked by the browser. Copy the output manually.', 'error')
    }
  }

  const handleDownload = () => {
    if (!hasOutput) return

    const base = fileName ? fileName.replace(/\.[^./\\]+$/, '') : 'schema'
    const name = sanitizeDownloadName(`${base}-examples.json`, 'schema-examples.json')

    downloadText(result.output, name, 'application/json;charset=utf-8')
    onNotify(`Downloaded ${name}.`, 'success')
  }

  return (
    <section
      id="schema"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-10 sm:px-6 lg:px-8"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="section-label">
            <Wand2 className="size-3.5" />
            Schema
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[1.7rem]">
            Generate examples from a schema or sample
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Paste a JSON Schema for precise control, or paste any sample JSON document and a
            schema is inferred from its shape. Types, fields, constraints, enums, formats, and
            local references are all respected.
          </p>
        </div>

        <button type="button" onClick={regenerate} className="btn-secondary h-8 px-3 text-xs">
          <RefreshCw className="size-3.5" />
          Regenerate
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200/80 bg-slate-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Examples
            </span>
            <Segmented
              ariaLabel="Number of examples"
              value={String(count)}
              options={countOptions}
              onChange={(value) => setCount(Number(value))}
            />
          </div>

          <span className="hidden h-5 w-px bg-slate-200 dark:bg-white/10 lg:block" aria-hidden="true" />

          <OptionToggle
            active={includeOptional}
            label="Include optional fields"
            onClick={() => setIncludeOptional(!includeOptional)}
          />

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {isGenerating && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                <Loader2 className="size-3 animate-spin" />
                Generating
              </span>
            )}
            <button type="button" onClick={loadSample} className="btn-secondary h-7 px-2.5 text-[11px]">
              <Wand2 className="size-3" />
              Sample schema
            </button>
            <button
              type="button"
              onClick={loadDocumentSample}
              className="btn-secondary h-7 px-2.5 text-[11px]"
            >
              <Wand2 className="size-3" />
              Sample document
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2">
          <ConvertPanel
            title="Schema input"
            tone="input"
            value={schemaText}
            dark={dark}
            language="json"
            status={status}
            errorLine={result.jsonError?.line ?? null}
            fileName={fileName}
            fileSize={fileSize}
            placeholder={'Paste a JSON Schema or a sample JSON document, drop a .json file…'}
            onChange={setSchemaText}
            onFile={(file) => void loadFile(file)}
            onClear={clear}
            onLoadSample={loadSample}
          />
          <ConvertPanel
            title="Generated examples"
            tone="output"
            value={result.output}
            dark={dark}
            language="json"
            readOnly
            placeholder="Generated examples will appear here…"
            onCopy={handleCopy}
            onDownload={handleDownload}
            canCopy={hasOutput}
            canDownload={hasOutput}
          />
        </div>

        {result.empty ? (
          <div className="flex items-start gap-2.5 border-t border-slate-200/80 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
            <Info className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <p>Paste a JSON Schema or sample document, or drop a .json file, to generate examples automatically.</p>
          </div>
        ) : !result.ok ? (
          <div className="border-t border-rose-200/70 bg-rose-50/70 px-4 py-3.5 dark:border-rose-400/20 dark:bg-rose-500/[0.07]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                <AlertTriangle className="size-3.5" />
              </span>
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
                {result.jsonError ? 'Invalid JSON' : 'Could not generate examples'}
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
                Generated {result.exampleCount} {result.exampleCount === 1 ? 'example' : 'examples'}
              </p>
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
        Generation happens entirely in your browser. Nothing is uploaded.
      </p>
    </section>
  )
}
