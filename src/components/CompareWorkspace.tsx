import { useDeferredValue, useMemo } from 'react'
import {
  ArrowLeftRight,
  Eraser,
  GitCompareArrows,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { ComparePanel } from './ComparePanel'
import { CompareResults } from './CompareResults'
import { compareJson } from '../lib/json/compare'
import type { CompareDocuments } from '../hooks/useCompareDocuments'
import type { ValidationState } from '../types/ui'

interface CompareWorkspaceProps {
  dark: boolean
  documents: CompareDocuments
}

function validationFor(isEmpty: boolean, hasError: boolean): ValidationState {
  if (isEmpty) return 'empty'
  return hasError ? 'invalid' : 'valid'
}

export function CompareWorkspace({ dark, documents }: CompareWorkspaceProps) {
  const {
    leftText,
    rightText,
    leftFile,
    rightFile,
    setLeftText,
    setRightText,
    loadFile,
    clearSide,
    loadSample,
    loadPair,
    clearAll,
    swap,
  } = documents

  const deferredLeft = useDeferredValue(leftText)
  const deferredRight = useDeferredValue(rightText)
  const isComparing = deferredLeft !== leftText || deferredRight !== rightText

  const result = useMemo(
    () => compareJson(deferredLeft, deferredRight),
    [deferredLeft, deferredRight],
  )

  const hasContent = leftText.length > 0 || rightText.length > 0

  return (
    <section
      id="compare"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-10 sm:px-6 lg:px-8"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="section-label">
            <GitCompareArrows className="size-3.5" />
            Compare
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[1.7rem]">
            Diff two JSON documents
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Drag and drop a <code className="font-mono text-[12px]">.json</code> file on either
            side — or paste JSON — to see every addition, removal, and change side by side.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={swap}
            disabled={!hasContent}
            className="btn-secondary h-8 px-3 text-xs"
          >
            <ArrowLeftRight className="size-3.5" />
            Swap sides
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={!hasContent}
            className="btn-secondary h-8 px-3 text-xs"
          >
            <Eraser className="size-3.5" />
            Clear both
          </button>
          <button type="button" onClick={loadPair} className="btn-primary h-8 px-3 text-xs">
            <Sparkles className="size-3.5" />
            Load sample pair
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <ComparePanel
            side="left"
            title="Original"
            value={leftText}
            onChange={setLeftText}
            dark={dark}
            errorLine={result.leftError?.line ?? null}
            validationState={validationFor(result.leftEmpty, result.leftError !== null)}
            fileName={leftFile?.name ?? null}
            fileSize={leftFile?.size ?? null}
            onFile={(file) => void loadFile('left', file)}
            onClear={() => clearSide('left')}
            onLoadSample={() => loadSample('left')}
          />
          <ComparePanel
            side="right"
            title="Modified"
            value={rightText}
            onChange={setRightText}
            dark={dark}
            errorLine={result.rightError?.line ?? null}
            validationState={validationFor(result.rightEmpty, result.rightError !== null)}
            fileName={rightFile?.name ?? null}
            fileSize={rightFile?.size ?? null}
            onFile={(file) => void loadFile('right', file)}
            onClear={() => clearSide('right')}
            onLoadSample={() => loadSample('right')}
          />
        </div>

        <CompareResults result={result} isComparing={isComparing} />
      </div>

      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="size-3.5 text-emerald-500" />
        Comparison happens entirely in your browser. Nothing is uploaded.
      </p>
    </section>
  )
}
