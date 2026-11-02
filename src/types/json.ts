export type IndentStyle = '2' | '4' | '8' | 'tab'

export type ArrayLayout = 'expand' | 'compact'

export interface FormatOptions {
  indent: IndentStyle
  sortKeys: boolean
  arrayLayout: ArrayLayout
  prettyNested: boolean
}

export type JsonErrorKind =
  | 'trailing-comma'
  | 'quotes'
  | 'brackets'
  | 'invalid-value'
  | 'missing-comma'
  | 'syntax'

export interface JsonErrorInfo {
  message: string
  line: number
  column: number
  position: number | null
  lineText: string
  caret: string
  suggestion: string
  kind: JsonErrorKind
}

export interface JsonStats {
  characters: number
  lines: number
  bytes: number
  objects: number
  arrays: number
  keys: number
  depth: number
  strings: number
  numbers: number
  booleans: number
  nulls: number
}

export interface ProcessingResult {
  ok: boolean
  empty: boolean
  data: unknown
  error: JsonErrorInfo | null
  formatted: string
  minified: string
  stats: JsonStats | null
  inputBytes: number
  formattedBytes: number
  minifiedBytes: number
  reduction: number
  durationMs: number
}

export interface JsonWorkerRequest {
  id: number
  text: string
  options: FormatOptions
}

export interface JsonWorkerResponse {
  id: number
  result: ProcessingResult
}
