import { useEffect, useRef } from 'react'
import { Cpu, Lock, ShieldCheck, X } from 'lucide-react'

interface PrivacyModalProps {
  open: boolean
  onClose: () => void
}

export function PrivacyModal({ open, onClose }: PrivacyModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    closeRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        className="animate-fade-up max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b111b]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h2 id="privacy-title" className="text-base font-semibold text-slate-900 dark:text-white">
                Privacy policy
              </h2>
              <p className="text-[11px] text-slate-400">Last updated: November 2026</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close privacy policy"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs leading-5 text-slate-600 dark:text-slate-400">
          <p>
            JSON Formatter Pro is a purely client-side tool. Everything you paste, upload, format,
            or download is processed inside your browser tab.
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
              <Lock className="size-3.5 text-emerald-500" />
              What we never do
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>We never send your JSON to a backend server.</li>
              <li>We never store your JSON in localStorage or cookies.</li>
              <li>We never transmit JSON content to analytics services.</li>
              <li>We do not load third-party tracking scripts on this page.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
              <Cpu className="size-3.5 text-sky-500" />
              How processing works
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Imported files are read with the browser File API.</li>
              <li>Validation, formatting, and statistics run locally, in a Web Worker.</li>
              <li>Downloads are generated in-browser with a Blob and object URL.</li>
              <li>Only your light/dark theme preference is saved locally.</li>
            </ul>
          </div>

          <p>
            Closing this dialog does not change any data. Refreshing or closing the tab discards
            your workspace, because nothing is persisted.
          </p>
        </div>

        <button type="button" onClick={onClose} className="btn-primary mt-5 w-full">
          Got it
        </button>
      </div>
    </div>
  )
}
