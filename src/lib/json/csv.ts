import { diagnoseJsonError } from './core'
import type { JsonErrorInfo } from '../../types/json'

export type Delimiter = ',' | ';' | '\t' | '|'

export type ConversionDirection = 'csv-to-json' | 'json-to-csv'

export interface CsvToJsonOptions {
  delimiter: Delimiter
  hasHeader: boolean
  inferTypes: boolean
}

export interface JsonToCsvOptions {
  delimiter: Delimiter
  includeHeader: boolean
}

export interface ConversionResult {
  ok: boolean
  empty: boolean
  output: string
  error: string | null
  jsonError: JsonErrorInfo | null
  records: number
  columns: number
  inputBytes: number
  outputBytes: number
  durationMs: number
}

const encoder = new TextEncoder()

const numberPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/

function emptyResult(): ConversionResult {
  return {
    ok: true,
    empty: true,
    output: '',
    error: null,
    jsonError: null,
    records: 0,
    columns: 0,
    inputBytes: 0,
    outputBytes: 0,
    durationMs: 0,
  }
}

function successResult(
  start: number,
  input: string,
  output: string,
  records: number,
  columns: number,
): ConversionResult {
  return {
    ok: true,
    empty: false,
    output,
    error: null,
    jsonError: null,
    records,
    columns,
    inputBytes: encoder.encode(input).length,
    outputBytes: encoder.encode(output).length,
    durationMs: Math.round((performance.now() - start) * 10) / 10,
  }
}

function failureResult(
  start: number,
  input: string,
  error: string,
  jsonError: JsonErrorInfo | null = null,
): ConversionResult {
  return {
    ok: false,
    empty: false,
    output: '',
    error,
    jsonError,
    records: 0,
    columns: 0,
    inputBytes: encoder.encode(input).length,
    outputBytes: 0,
    durationMs: Math.round((performance.now() - start) * 10) / 10,
  }
}

function parseCsvRows(text: string, delimiter: Delimiter): string[][] {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]

    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        field += character
      }
      continue
    }

    if (character === '"') {
      inQuotes = true
    } else if (character === delimiter) {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (character === '\r') {
      if (source[index + 1] === '\n') index += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((entry) => entry.some((cell) => cell.length > 0))
}

function normalizeHeaders(
  rows: string[][],
  hasHeader: boolean,
): { headers: string[]; dataRows: string[][] } {
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)
  const headers: string[] = []
  const used = new Map<string, number>()

  for (let index = 0; index < columnCount; index += 1) {
    const raw = hasHeader ? (rows[0][index] ?? '').trim() : ''
    const base = raw.length > 0 ? raw : `column_${index + 1}`
    const seen = used.get(base) ?? 0
    used.set(base, seen + 1)
    headers.push(seen === 0 ? base : `${base}_${seen + 1}`)
  }

  return { headers, dataRows: hasHeader ? rows.slice(1) : rows }
}

function inferValue(raw: string): unknown {
  const trimmed = raw.trim()

  if (trimmed.length === 0) return ''
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (numberPattern.test(trimmed)) return Number(trimmed)

  return raw
}

export function csvToJson(text: string, options: CsvToJsonOptions): ConversionResult {
  const start = performance.now()

  if (text.trim().length === 0) return emptyResult()

  const rows = parseCsvRows(text, options.delimiter)
  if (rows.length === 0) return emptyResult()

  const { headers, dataRows } = normalizeHeaders(rows, options.hasHeader)
  const records = dataRows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => {
      const record: Record<string, unknown> = {}
      headers.forEach((header, index) => {
        const raw = row[index] ?? ''
        record[header] = options.inferTypes ? inferValue(raw) : raw
      })
      return record
    })

  return successResult(
    start,
    text,
    JSON.stringify(records, null, 2),
    records.length,
    headers.length,
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  try {
    return JSON.stringify(value) ?? ''
  } catch {
    return ''
  }
}

function escapeCell(value: string, delimiter: Delimiter): string {
  if (value.length === 0) return ''
  const needsQuotes =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r') ||
    value.trim() !== value

  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value
}

export function jsonToCsv(text: string, options: JsonToCsvOptions): ConversionResult {
  const start = performance.now()

  if (text.trim().length === 0) return emptyResult()

  let data: unknown

  try {
    data = JSON.parse(text)
  } catch (error) {
    const jsonError = diagnoseJsonError(text, error)
    return failureResult(start, text, jsonError.message, jsonError)
  }

  let records: unknown[]

  if (Array.isArray(data)) {
    records = data
  } else if (isPlainObject(data)) {
    records = [data]
  } else {
    return failureResult(
      start,
      text,
      'Top-level JSON must be an array of objects, an array of values, or a single object.',
    )
  }

  const columns: string[] = []
  const seen = new Set<string>()

  for (const record of records) {
    if (isPlainObject(record)) {
      for (const key of Object.keys(record)) {
        if (!seen.has(key)) {
          seen.add(key)
          columns.push(key)
        }
      }
    } else if (!seen.has('value')) {
      seen.add('value')
      columns.push('value')
    }
  }

  if (columns.length === 0) {
    return successResult(start, text, '', 0, 0)
  }

  const lines: string[] = []

  if (options.includeHeader) {
    lines.push(columns.map((column) => escapeCell(column, options.delimiter)).join(options.delimiter))
  }

  for (const record of records) {
    const cells = columns.map((column) => {
      const value = isPlainObject(record) ? record[column] : column === 'value' ? record : ''
      return escapeCell(cellValue(value), options.delimiter)
    })
    lines.push(cells.join(options.delimiter))
  }

  return successResult(start, text, lines.join('\n'), records.length, columns.length)
}
