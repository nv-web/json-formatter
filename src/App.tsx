import { useCallback, useEffect, useRef, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { FormatToolbar } from './components/FormatToolbar'
import { InputPanel } from './components/InputPanel'
import type { ValidationState } from './components/InputPanel'
import { OutputPanel } from './components/OutputPanel'
import { ValidationBanner } from './components/ValidationBanner'
import { StatsSection } from './components/StatsSection'
import { TreeViewer } from './components/TreeViewer'
import { Documentation } from './components/Documentation'
import { CompareWorkspace } from './components/CompareWorkspace'
import { ConvertWorkspace } from './components/ConvertWorkspace'
import { SchemaWorkspace } from './components/SchemaWorkspace'
import { PrivacyModal } from './components/PrivacyModal'
import { Footer } from './components/Footer'
import { Toast } from './components/Toast'
import { useTheme } from './hooks/useTheme'
import { useJsonWorker } from './hooks/useJsonWorker'
import { useCompareDocuments } from './hooks/useCompareDocuments'
import { useConverter } from './hooks/useConverter'
import { useSchemaGenerator } from './hooks/useSchemaGenerator'
import { useScreen } from './hooks/useScreen'
import {
  DEFAULT_OPTIONS,
  formatBytes,
  formatNumber,
  processJson,
} from './lib/json/core'
import {
  baseNameOf,
  copyText,
  downloadJson,
  isJsonFile,
  sanitizeFilename,
} from './lib/json/file'
import { SAMPLE_JSON } from './lib/json/sample'
import type { FormatOptions, IndentStyle } from './types/json'
import type { OutputMode, ToastMessage, ToastTone } from './types/ui'

const MAX_FILE_BYTES = 20 * 1024 * 1024

function indentLabel(indent: IndentStyle): string {
  return indent === 'tab' ? 'a tab' : `${indent} spaces`
}

function defaultFilenameFor(mode: OutputMode, sourceName: string | null): string {
  const suffix = mode === 'minified' ? 'minified' : 'formatted'
  if (!sourceName) return `${suffix}-json.json`
  return `${baseNameOf(sourceName)}-${suffix}.json`
}

export default function App() {
  const [text, setText] = useState(SAMPLE_JSON)
  const [options, setOptions] = useState<FormatOptions>(DEFAULT_OPTIONS)
  const [viewMode, setViewMode] = useState<OutputMode>('formatted')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null)
  const [filename, setFilename] = useState('formatted-json.json')
  const [filenameTouched, setFilenameTouched] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  const screen = useScreen()
  const { theme, toggleTheme } = useTheme()
  const { result, isProcessing, refresh } = useJsonWorker(text, options)

  const toastTimer = useRef<number | null>(null)
  const toastId = useRef(0)

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastId.current += 1
    setToast({ id: toastId.current, tone, message })
    toastTimer.current = window.setTimeout(() => setToast(null), 3800)
  }, [])

  const compareDocuments = useCompareDocuments(showToast)
  const converter = useConverter(showToast)
  const schemaGenerator = useSchemaGenerator(showToast)

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    }
  }, [])

  useEffect(() => {
    const preventFileNavigation = (event: DragEvent) => event.preventDefault()
    window.addEventListener('dragover', preventFileNavigation)
    window.addEventListener('drop', preventFileNavigation)
    return () => {
      window.removeEventListener('dragover', preventFileNavigation)
      window.removeEventListener('drop', preventFileNavigation)
    }
  }, [])

  useEffect(() => {
    if (filenameTouched) return
    setFilename(defaultFilenameFor(viewMode, fileInfo?.name ?? null))
  }, [viewMode, fileInfo, filenameTouched])

  const handleFile = useCallback(
    async (file: File) => {
      if (!isJsonFile(file)) {
        showToast('That file type is not supported. Choose a .json file.', 'error')
        return
      }

      if (file.size > MAX_FILE_BYTES) {
        showToast('This file is larger than 20 MB. Try a smaller document.', 'error')
        return
      }

      try {
        const content = await file.text()
        setText(content)
        setFileInfo({ name: file.name, size: file.size })
        setFilenameTouched(false)
        showToast(
          content.trim().length === 0
            ? `${file.name} is empty. Paste some JSON to get started.`
            : `Loaded ${file.name} (${formatBytes(file.size)}).`,
          content.trim().length === 0 ? 'info' : 'success',
        )
      } catch {
        showToast('The file could not be read. Please try again.', 'error')
      }
    },
    [showToast],
  )

  const handleClear = useCallback(() => {
    setText('')
    setFileInfo(null)
    showToast('Input cleared.', 'info')
  }, [showToast])

  const handleLoadSample = useCallback(() => {
    setText(SAMPLE_JSON)
    setFileInfo(null)
    setFilenameTouched(false)
    setViewMode('formatted')
    showToast('Sample JSON loaded.', 'info')
  }, [showToast])

  const handleReset = useCallback(() => {
    setText('')
    setFileInfo(null)
    setOptions(DEFAULT_OPTIONS)
    setViewMode('formatted')
    setFilenameTouched(false)
    showToast('Workspace reset.', 'info')
  }, [showToast])

  const handleFormat = useCallback(() => {
    const outcome = processJson(text, options)
    setViewMode('formatted')

    if (outcome.empty) {
      showToast('Paste JSON or load the sample first.', 'info')
      return
    }
    if (!outcome.ok) {
      showToast(
        `Invalid JSON at line ${outcome.error?.line ?? 1}. Fix the error before formatting.`,
        'error',
      )
      return
    }

    refresh()
    showToast(`Formatted with ${indentLabel(options.indent)} indentation.`, 'success')
  }, [text, options, refresh, showToast])

  const handleMinify = useCallback(() => {
    const outcome = processJson(text, options)
    setViewMode('minified')

    if (outcome.empty) {
      showToast('Paste JSON or load the sample first.', 'info')
      return
    }
    if (!outcome.ok) {
      showToast('Invalid JSON. Fix the error before minifying.', 'error')
      return
    }

    refresh()
    showToast(
      outcome.reduction > 0
        ? `Minified output is ${outcome.reduction}% smaller than the input.`
        : 'Minified output is ready.',
      'success',
    )
  }, [text, options, refresh, showToast])

  const handleValidate = useCallback(() => {
    const outcome = processJson(text, options)
    refresh()

    if (outcome.empty) {
      showToast('Paste JSON or load the sample to validate.', 'info')
      return
    }
    if (!outcome.ok && outcome.error) {
      showToast(
        `Invalid JSON — line ${outcome.error.line}, column ${outcome.error.column}.`,
        'error',
      )
      return
    }

    showToast(
      `Valid JSON — ${formatNumber(outcome.stats?.keys ?? 0)} keys across ${formatNumber(
        outcome.stats?.objects ?? 0,
      )} objects.`,
      'success',
    )
  }, [text, options, refresh, showToast])

  const handleCopy = useCallback(
    async (mode: OutputMode) => {
      const outcome = processJson(text, options)

      if (outcome.empty) {
        showToast('There is no JSON to copy yet.', 'error')
        return
      }
      if (!outcome.ok) {
        showToast('Invalid JSON cannot be copied. Fix the syntax error first.', 'error')
        return
      }

      const content = mode === 'formatted' ? outcome.formatted : outcome.minified
      const bytes = mode === 'formatted' ? outcome.formattedBytes : outcome.minifiedBytes

      try {
        await copyText(content)
        showToast(`Copied ${mode} JSON (${formatBytes(bytes)}).`, 'success')
      } catch {
        showToast(
          'Clipboard access was blocked by the browser. Select the output and copy manually.',
          'error',
        )
      }
    },
    [text, options, showToast],
  )

  const handleDownload = useCallback(() => {
    const outcome = processJson(text, options)

    if (outcome.empty) {
      showToast('There is no JSON to download yet.', 'error')
      return
    }
    if (!outcome.ok) {
      showToast('Invalid JSON cannot be downloaded. Fix the syntax error first.', 'error')
      return
    }

    const content = viewMode === 'formatted' ? outcome.formatted : outcome.minified
    const safeName = sanitizeFilename(filename)
    downloadJson(content, safeName)
    showToast(`Downloaded ${safeName}.`, 'success')
  }, [text, options, viewMode, filename, showToast])

  useEffect(() => {
    if (screen !== 'formatter') return

    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey
      if (!modifier) return

      if (event.key === 'Enter') {
        event.preventDefault()
        handleValidate()
      } else if (event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault()
        handleMinify()
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [handleValidate, handleMinify, screen])

  const validationState: ValidationState = result.empty
    ? 'empty'
    : result.ok
      ? 'valid'
      : 'invalid'

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Header theme={theme} onToggleTheme={toggleTheme} screen={screen} />

      <main key={screen} className="animate-fade-up">
        {screen === 'home' && <Hero />}

        {screen === 'formatter' && (
          <section
            id="workspace"
            className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-10 sm:px-6 lg:px-8"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Live workspace
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Auto-validation · 260 ms debounce · Web Worker
              </span>
            </div>

            <div className="card overflow-hidden">
              <FormatToolbar
                options={options}
                onOptionsChange={setOptions}
                viewMode={viewMode}
                onFormat={handleFormat}
                onMinify={handleMinify}
                onValidate={handleValidate}
                onReset={handleReset}
                canReset={text.length > 0 || fileInfo !== null}
              />

              <div className="grid lg:grid-cols-2">
                <InputPanel
                  value={text}
                  onChange={setText}
                  dark={theme === 'dark'}
                  errorLine={result.error?.line ?? null}
                  validationState={validationState}
                  isProcessing={isProcessing}
                  fileName={fileInfo?.name ?? null}
                  fileSize={fileInfo?.size ?? null}
                  onFile={handleFile}
                  onClear={handleClear}
                  onLoadSample={handleLoadSample}
                />
                <OutputPanel
                  result={result}
                  viewMode={viewMode}
                  isProcessing={isProcessing}
                  dark={theme === 'dark'}
                  filename={filename}
                  onFilenameChange={(value) => {
                    setFilename(value)
                    setFilenameTouched(true)
                  }}
                  onCopy={handleCopy}
                  onDownload={handleDownload}
                  onLoadSample={handleLoadSample}
                />
              </div>

              <ValidationBanner result={result} isProcessing={isProcessing} />
            </div>

            <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              100% client-side processing. Your JSON never leaves this browser tab.
            </p>

            <div className="mt-12">
              <StatsSection
                stats={result.stats}
                durationMs={result.durationMs}
                isProcessing={isProcessing}
              />
            </div>

            <div className="mt-10">
              <TreeViewer result={result} onLoadSample={handleLoadSample} />
            </div>
          </section>
        )}

        {screen === 'compare' && (
          <CompareWorkspace dark={theme === 'dark'} documents={compareDocuments} />
        )}

        {screen === 'convert' && (
          <ConvertWorkspace
            dark={theme === 'dark'}
            converter={converter}
            onNotify={showToast}
          />
        )}

        {screen === 'schema' && (
          <SchemaWorkspace
            dark={theme === 'dark'}
            generator={schemaGenerator}
            onNotify={showToast}
          />
        )}

        {screen === 'docs' && (
          <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
            <Documentation />
          </div>
        )}
      </main>

      <Footer onOpenPrivacy={() => setPrivacyOpen(true)} />

      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
