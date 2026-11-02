import { diagnoseJsonError } from './core'
import type { JsonErrorInfo } from '../../types/json'

export type DiffKind = 'added' | 'removed' | 'changed' | 'type-changed'

export type JsonValueType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'missing'

export interface JsonDiffEntry {
  id: string
  path: string
  kind: DiffKind
  left: unknown
  right: unknown
  leftType: JsonValueType
  rightType: JsonValueType
}

export interface JsonCompareCounts {
  added: number
  removed: number
  changed: number
  total: number
}

export interface JsonCompareResult {
  leftEmpty: boolean
  rightEmpty: boolean
  leftError: JsonErrorInfo | null
  rightError: JsonErrorInfo | null
  entries: JsonDiffEntry[]
  counts: JsonCompareCounts
  identical: boolean
  canCompare: boolean
  truncated: boolean
  durationMs: number
}

export const MAX_DIFF_ENTRIES = 300

interface SideParse {
  empty: boolean
  error: JsonErrorInfo | null
  data: unknown
}

function parseSide(text: string): SideParse {
  if (text.trim().length === 0) {
    return { empty: true, error: null, data: null }
  }

  try {
    return { empty: false, error: null, data: JSON.parse(text) }
  } catch (error) {
    return { empty: false, error: diagnoseJsonError(text, error), data: null }
  }
}

export function jsonTypeOf(value: unknown): JsonValueType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'missing'
}

const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/

function objectPath(base: string, key: string): string {
  return identifierPattern.test(key) ? `${base}.${key}` : `${base}[${JSON.stringify(key)}]`
}

function arrayPath(base: string, index: number): string {
  return `${base}[${index}]`
}

interface WalkContext {
  entries: JsonDiffEntry[]
  truncated: boolean
}

function pushEntry(
  context: WalkContext,
  path: string,
  kind: DiffKind,
  left: unknown,
  right: unknown,
): void {
  if (context.entries.length >= MAX_DIFF_ENTRIES) {
    context.truncated = true
    return
  }

  context.entries.push({
    id: `${context.entries.length}:${kind}:${path}`,
    path,
    kind,
    left,
    right,
    leftType: left === undefined ? 'missing' : jsonTypeOf(left),
    rightType: right === undefined ? 'missing' : jsonTypeOf(right),
  })
}

function walk(left: unknown, right: unknown, path: string, context: WalkContext): void {
  if (context.entries.length >= MAX_DIFF_ENTRIES) {
    context.truncated = true
    return
  }

  const leftType = jsonTypeOf(left)
  const rightType = jsonTypeOf(right)

  if (leftType !== rightType) {
    pushEntry(context, path, 'type-changed', left, right)
    return
  }

  if (leftType === 'object') {
    const leftObject = left as Record<string, unknown>
    const rightObject = right as Record<string, unknown>
    const keys = Array.from(
      new Set([...Object.keys(leftObject), ...Object.keys(rightObject)]),
    ).sort()

    for (const key of keys) {
      if (context.entries.length >= MAX_DIFF_ENTRIES) {
        context.truncated = true
        return
      }

      const childPath = objectPath(path, key)
      const inLeft = Object.hasOwn(leftObject, key)
      const inRight = Object.hasOwn(rightObject, key)

      if (inLeft && !inRight) {
        pushEntry(context, childPath, 'removed', leftObject[key], undefined)
      } else if (!inLeft && inRight) {
        pushEntry(context, childPath, 'added', undefined, rightObject[key])
      } else {
        walk(leftObject[key], rightObject[key], childPath, context)
      }
    }
    return
  }

  if (leftType === 'array') {
    const leftArray = left as unknown[]
    const rightArray = right as unknown[]
    const length = Math.max(leftArray.length, rightArray.length)

    for (let index = 0; index < length; index += 1) {
      if (context.entries.length >= MAX_DIFF_ENTRIES) {
        context.truncated = true
        return
      }

      const childPath = arrayPath(path, index)

      if (index >= rightArray.length) {
        pushEntry(context, childPath, 'removed', leftArray[index], undefined)
      } else if (index >= leftArray.length) {
        pushEntry(context, childPath, 'added', undefined, rightArray[index])
      } else {
        walk(leftArray[index], rightArray[index], childPath, context)
      }
    }
    return
  }

  if (left !== right) {
    pushEntry(context, path, 'changed', left, right)
  }
}

function summarize(entries: JsonDiffEntry[]): JsonCompareCounts {
  let added = 0
  let removed = 0
  let changed = 0

  for (const entry of entries) {
    if (entry.kind === 'added') added += 1
    else if (entry.kind === 'removed') removed += 1
    else changed += 1
  }

  return { added, removed, changed, total: entries.length }
}

export function compareJson(leftText: string, rightText: string): JsonCompareResult {
  const start = performance.now()
  const left = parseSide(leftText)
  const right = parseSide(rightText)
  const canCompare =
    !left.empty && !right.empty && left.error === null && right.error === null

  const context: WalkContext = { entries: [], truncated: false }

  if (canCompare) {
    walk(left.data, right.data, '$', context)
  }

  return {
    leftEmpty: left.empty,
    rightEmpty: right.empty,
    leftError: left.error,
    rightError: right.error,
    entries: context.entries,
    counts: summarize(context.entries),
    identical: canCompare && context.entries.length === 0,
    canCompare,
    truncated: context.truncated,
    durationMs: Math.round((performance.now() - start) * 10) / 10,
  }
}

export function previewValue(value: unknown): string {
  if (value === undefined) return 'missing'

  const type = jsonTypeOf(value)

  if (type === 'object' || type === 'array') {
    let serialized: string
    try {
      serialized = JSON.stringify(value)
    } catch {
      return type === 'array' ? '[…]' : '{…}'
    }
    const limit = 90
    return serialized.length > limit ? `${serialized.slice(0, limit)}…` : serialized
  }

  if (type === 'string') {
    const serialized = JSON.stringify(value)
    return serialized.length > 90 ? `${serialized.slice(0, 90)}…` : serialized
  }

  return String(value)
}
