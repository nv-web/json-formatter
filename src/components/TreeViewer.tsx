import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  ListTree,
} from 'lucide-react'
import { cx } from '../lib/cx'
import { formatNumber } from '../lib/json/core'
import type { ProcessingResult } from '../types/json'

const MAX_EXPANDED_NODES = 4000
const PAGE_SIZE = 100

type Container = Record<string, unknown> | unknown[]

interface TreeViewerProps {
  result: ProcessingResult
  onLoadSample: () => void
}

function isContainer(value: unknown): value is Container {
  return typeof value === 'object' && value !== null
}

function entriesOf(value: Container): Array<[string, unknown]> {
  if (Array.isArray(value)) {
    return value.map((item, index) => [String(index), item])
  }
  return Object.entries(value)
}

function makePath(parent: string, key: string, parentIsArray: boolean): string {
  return parentIsArray ? `${parent}[${key}]` : `${parent}[${JSON.stringify(key)}]`
}

function initialExpanded(value: unknown): Set<string> {
  const expanded = new Set<string>(['$'])

  if (isContainer(value)) {
    const parentIsArray = Array.isArray(value)
    const entries = entriesOf(value)
    if (entries.length <= 16) {
      for (const [key, child] of entries) {
        if (isContainer(child)) expanded.add(makePath('$', key, parentIsArray))
      }
    }
  }

  return expanded
}

function collectAllPaths(value: unknown): { paths: Set<string>; limited: boolean } {
  const paths = new Set<string>()
  const stack: Array<{ value: unknown; path: string }> = [{ value, path: '$' }]
  let limited = false

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || !isContainer(current.value)) continue

    if (paths.size >= MAX_EXPANDED_NODES) {
      limited = true
      break
    }

    paths.add(current.path)
    const parentIsArray = Array.isArray(current.value)
    const entries = entriesOf(current.value)

    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const [key, child] = entries[index]
      if (isContainer(child)) {
        stack.push({ value: child, path: makePath(current.path, key, parentIsArray) })
      }
    }
  }

  return { paths, limited }
}

type ValueType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

const typeStyles: Record<ValueType, string> = {
  object:
    'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  array: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  string:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  number: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  boolean: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  null: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
}

const valueStyles: Record<Exclude<ValueType, 'object' | 'array'>, string> = {
  string: 'text-emerald-700 dark:text-emerald-300',
  number: 'text-amber-700 dark:text-amber-300',
  boolean: 'text-blue-700 dark:text-blue-300',
  null: 'text-rose-600 dark:text-rose-400',
}

function typeOf(value: unknown): ValueType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  const type = typeof value
  if (type === 'object') return 'object'
  if (type === 'string') return 'string'
  if (type === 'number') return 'number'
  if (type === 'boolean') return 'boolean'
  return 'null'
}

function TypeBadge({ type }: { type: ValueType }) {
  return (
    <span
      className={cx(
        'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
        typeStyles[type],
      )}
    >
      {type}
    </span>
  )
}

function EntryKey({ name, parentIsArray }: { name: string; parentIsArray: boolean }) {
  return (
    <>
      <span
        className={cx(
          'shrink-0 font-mono text-[11px]',
          parentIsArray
            ? 'text-slate-400 dark:text-slate-500'
            : 'text-violet-700 dark:text-violet-300',
        )}
      >
        {parentIsArray ? `[${name}]` : JSON.stringify(name)}
      </span>
      <span className="shrink-0 font-mono text-[11px] text-slate-400 dark:text-slate-500">
        :
      </span>
    </>
  )
}

function primitiveDisplay(value: unknown): { display: string; full: string } {
  if (typeof value === 'string') {
    const truncated = value.length > 140 ? `${value.slice(0, 140)}…` : value
    return { display: JSON.stringify(truncated), full: value }
  }
  if (value === null) return { display: 'null', full: 'null' }
  return { display: String(value), full: String(value) }
}

interface NodeProps {
  name: string
  value: unknown
  path: string
  depth: number
  isRoot?: boolean
  parentIsArray?: boolean
  expanded: Set<string>
  onToggle: (path: string) => void
}

function PrimitiveNode({
  name,
  value,
  depth,
  isRoot = false,
  parentIsArray = false,
}: NodeProps) {
  const type = typeOf(value) as Exclude<ValueType, 'object' | 'array'>
  const { display, full } = primitiveDisplay(value)

  return (
    <div
      className="flex items-center gap-1.5 rounded-md py-1 pr-2 transition-colors hover:bg-slate-100/80 dark:hover:bg-white/[0.04]"
      style={{ paddingLeft: 8 + depth * 14 }}
    >
      <span className="size-3.5 shrink-0" aria-hidden="true" />
      {isRoot ? (
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          root
        </span>
      ) : (
        <EntryKey name={name} parentIsArray={parentIsArray} />
      )}
      <TypeBadge type={type} />
      <span
        className={cx('min-w-0 truncate font-mono text-[11px]', valueStyles[type])}
        title={full}
      >
        {display}
      </span>
    </div>
  )
}

function ContainerNode({
  name,
  value,
  path,
  depth,
  isRoot = false,
  parentIsArray = false,
  expanded,
  onToggle,
}: NodeProps & { value: Container }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const parentIsArrayContainer = Array.isArray(value)
  const entries = entriesOf(value)
  const isOpen = expanded.has(path)
  const hasChildren = entries.length > 0
  const visibleEntries = entries.slice(0, visibleCount)
  const remaining = entries.length - visibleEntries.length
  const type: ValueType = parentIsArrayContainer ? 'array' : 'object'

  return (
    <div>
      <div
        className="flex items-center gap-1.5 rounded-md py-1 pr-2 transition-colors hover:bg-slate-100/80 dark:hover:bg-white/[0.04]"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(path)}
          disabled={!hasChildren}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${isRoot ? 'root' : name}`}
          className={cx(
            'flex size-3.5 shrink-0 items-center justify-center rounded text-slate-400 transition-colors',
            hasChildren &&
              'hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200',
          )}
        >
          {hasChildren ? (
            <ChevronRight
              className={cx('size-3.5 transition-transform duration-150', isOpen && 'rotate-90')}
            />
          ) : (
            <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          )}
        </button>

        {isRoot ? (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            root
          </span>
        ) : (
          <EntryKey name={name} parentIsArray={parentIsArray} />
        )}

        <TypeBadge type={type} />
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
          {parentIsArrayContainer
            ? `${formatNumber(entries.length)} ${entries.length === 1 ? 'item' : 'items'}`
            : `${formatNumber(entries.length)} ${entries.length === 1 ? 'key' : 'keys'}`}
        </span>
        {!isOpen && hasChildren && (
          <span className="font-mono text-[11px] text-slate-300 dark:text-slate-600">…</span>
        )}
      </div>

      {isOpen && hasChildren && (
        <div>
          {visibleEntries.map(([key, child]) => (
            <TreeNode
              key={makePath(path, key, parentIsArrayContainer)}
              name={key}
              value={child}
              path={makePath(path, key, parentIsArrayContainer)}
              depth={depth + 1}
              parentIsArray={parentIsArrayContainer}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}

          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="my-1 rounded-md text-[11px] font-medium text-violet-600 transition-colors hover:text-violet-500 hover:underline dark:text-violet-400"
              style={{ marginLeft: 24 + (depth + 1) * 14 }}
            >
              Show {formatNumber(Math.min(remaining, PAGE_SIZE))} more
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TreeNode(props: NodeProps) {
  if (isContainer(props.value)) {
    return <ContainerNode {...props} value={props.value} />
  }
  return <PrimitiveNode {...props} />
}

export function TreeViewer({ result, onLoadSample }: TreeViewerProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => initialExpanded(result.data))
  const [limitNotice, setLimitNotice] = useState(false)
  const available = result.ok && !result.empty

  useEffect(() => {
    setExpanded(initialExpanded(result.data))
    setLimitNotice(false)
  }, [result.data])

  const toggle = (path: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <section id="tree" className="scroll-mt-24">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3.5 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                <ListTree className="size-4" />
              </span>
              <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                JSON tree viewer
              </h2>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Expand objects and arrays, inspect data types, and explore nested values.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (!available) return
                const collected = collectAllPaths(result.data)
                setExpanded(collected.paths)
                setLimitNotice(collected.limited)
              }}
              disabled={!available}
              className="btn-secondary h-7 px-2.5 text-[11px]"
            >
              <ChevronsDown className="size-3.5" />
              Expand all
            </button>
            <button
              type="button"
              onClick={() => {
                setExpanded(new Set(['$']))
                setLimitNotice(false)
              }}
              disabled={!available}
              className="btn-secondary h-7 px-2.5 text-[11px]"
            >
              <ChevronsUp className="size-3.5" />
              Collapse all
            </button>
          </div>
        </div>

        {available ? (
          <>
            <div className="max-h-[440px] overflow-auto bg-slate-50/50 p-2 dark:bg-black/20">
              <TreeNode
                name="root"
                value={result.data}
                path="$"
                depth={0}
                isRoot
                expanded={expanded}
                onToggle={toggle}
              />
            </div>
            {limitNotice && (
              <p className="border-t border-slate-200/80 px-4 py-2 text-[11px] text-amber-600 dark:border-white/10 dark:text-amber-400">
                Expanded the first {formatNumber(MAX_EXPANDED_NODES)} containers for performance.
                Use the chevrons to expand deeper branches.
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-slate-500">
              {result.error ? <AlertTriangle className="size-5" /> : <ListTree className="size-5" />}
            </span>
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              {result.error ? 'Tree view unavailable' : 'Nothing to explore yet'}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
              {result.error
                ? 'Resolve the syntax error in the input editor to render the JSON tree.'
                : 'Paste valid JSON or load the sample to browse its structure interactively.'}
            </p>
            {!result.error && (
              <button type="button" onClick={onLoadSample} className="btn-secondary mt-4 h-8 px-3 text-xs">
                Load sample JSON
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
