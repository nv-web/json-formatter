import type {
  FormatOptions,
  JsonErrorInfo,
  JsonErrorKind,
  JsonStats,
  ProcessingResult,
} from '../../types/json'

export const DEFAULT_OPTIONS: FormatOptions = {
  indent: '2',
  sortKeys: false,
  arrayLayout: 'expand',
  prettyNested: true,
}

const encoder = new TextEncoder()

export function indentUnit(options: FormatOptions): string {
  return options.indent === 'tab' ? '\t' : ' '.repeat(Number(options.indent))
}

function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return typeof value === 'object' && value !== null
}

function isPrimitive(value: unknown): boolean {
  return value === null || typeof value !== 'object'
}

function compareKeys([a]: [string, unknown], [b]: [string, unknown]): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function serializeValue(
  value: unknown,
  options: FormatOptions,
  depth: number,
  inline: boolean,
): string {
  if (value === null) return 'null'

  const type = typeof value

  if (type === 'string') return JSON.stringify(value)
  if (type === 'number') return Number.isFinite(value as number) ? String(value) : 'null'
  if (type === 'boolean') return value ? 'true' : 'false'

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'

    const childInline = inline || !options.prettyNested
    const values = value.map((item) =>
      serializeValue(item, options, depth + 1, childInline),
    )

    if (inline) return `[${values.join(',')}]`

    if (options.arrayLayout === 'compact' && value.every(isPrimitive)) {
      return `[${values.join(', ')}]`
    }

    const unit = indentUnit(options)
    const childIndent = unit.repeat(depth + 1)
    const closeIndent = unit.repeat(depth)
    return `[\n${childIndent}${values.join(`,\n${childIndent}`)}\n${closeIndent}]`
  }

  if (type === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
    if (options.sortKeys) entries.sort(compareKeys)
    if (entries.length === 0) return '{}'

    const childInline = inline || !options.prettyNested
    const values = entries.map(([key, item]) => {
      const serialized = serializeValue(item, options, depth + 1, childInline)
      return `${JSON.stringify(key)}:${inline ? '' : ' '}${serialized}`
    })

    if (inline) {
      return `{${values.join(',')}}`
    }

    const unit = indentUnit(options)
    const childIndent = unit.repeat(depth + 1)
    const closeIndent = unit.repeat(depth)
    return `{\n${childIndent}${values.join(`,\n${childIndent}`)}\n${closeIndent}}`
  }

  return 'null'
}

export function formatJson(value: unknown, options: FormatOptions): string {
  return serializeValue(value, options, 0, false)
}

export function minifyJson(value: unknown, options: FormatOptions): string {
  return serializeValue(value, options, 0, true)
}

function countUnescapedQuotes(text: string): number {
  let count = 0
  let escaped = false
  for (const char of text) {
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
    } else if (char === '"') {
      count += 1
    }
  }
  return count
}

function missingClosingSuggestion(text: string): string {
  const trimmed = text.trimEnd()
  const last = trimmed[trimmed.length - 1]

  if (countUnescapedQuotes(text) % 2 === 1) {
    return 'A string is missing its closing double quote. Add the quote, then close any open braces or brackets.'
  }
  if (last === ',') {
    return 'The input ends with a comma. Remove it, or add the next value followed by a closing brace "}" or bracket "]".'
  }
  if (last === '{' || last === '[') {
    return `The ${last === '{' ? 'object' : 'array'} is empty and missing its closing ${last === '{' ? '"}"' : '"]"'}.`
  }
  return 'The JSON ends unexpectedly. Add the missing closing brace "}" or bracket "]" so every opening character is matched.'
}

function looksLikeTrailingComma(text: string, position: number | null): boolean {
  if (position == null) return /,\s*[}\]]/.test(text)
  const start = Math.max(0, position - 10)
  const end = Math.min(text.length, position + 10)
  return /,\s*[}\]]/.test(text.slice(start, end))
}

export function diagnoseJsonError(text: string, error: unknown): JsonErrorInfo {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  const lineColumnMatch = message.match(/line (\d+) column (\d+)/i)
  const positionMatch = message.match(/position (\d+)/i)

  let position: number | null = null
  if (positionMatch) {
    const parsed = Number.parseInt(positionMatch[1], 10)
    if (Number.isFinite(parsed)) position = Math.min(Math.max(parsed, 0), text.length)
  } else if (/unexpected end|end of json input|end of data/i.test(lower)) {
    position = text.length
  }

  if (position == null) {
    const inferredToken = message.match(/unexpected token '([^']*)'/i)?.[1]
    const missingValue = /:\s*[}\]]/.exec(text)
    const trailing = /,\s*[}\]]/.exec(text)
    const singleQuote = text.indexOf("'")
    const comment = text.search(/\/[/*]/)

    if (missingValue) {
      position = missingValue.index + missingValue[0].length - 1
    } else if (trailing) {
      position = trailing.index + 1
    } else if (inferredToken === "'" && singleQuote >= 0) {
      position = singleQuote
    } else if (inferredToken === '/' && comment >= 0) {
      position = comment
    }
  }

  const lines = text.split(/\r\n|\n|\r/)
  let line = 1
  let column = 1

  if (lineColumnMatch) {
    line = Math.max(1, Number.parseInt(lineColumnMatch[1], 10))
    column = Math.max(1, Number.parseInt(lineColumnMatch[2], 10))
  } else if (position != null) {
    const before = text.slice(0, position)
    line = (before.match(/\n/g)?.length ?? 0) + 1
    column = position - before.lastIndexOf('\n')
  }

  line = Math.min(Math.max(line, 1), Math.max(lines.length, 1))
  const lineText = lines[line - 1] ?? ''
  column = Math.min(Math.max(column, 1), lineText.length + 1)

  const beforeText = position != null ? text.slice(0, position) : text
  const charAtPosition = position != null ? text[position] ?? '' : ''
  const precedingChar = beforeText.trimEnd().slice(-1)
  const beforeTrimmed = beforeText.trimEnd()
  const trailingComma = looksLikeTrailingComma(text, position)
  const atEnd = position != null && position >= text.trimEnd().length

  let kind: JsonErrorKind = 'syntax'
  let suggestion =
    'Check the syntax near the highlighted position. JSON requires double-quoted strings, commas between items, and matching braces and brackets.'

  if (/unexpected end|end of json input|end of data/i.test(lower)) {
    kind = 'brackets'
    suggestion = missingClosingSuggestion(text)
  } else if (/unterminated string/i.test(lower)) {
    kind = 'quotes'
    suggestion =
      'A string is missing its closing double quote. Make sure every opening quote has a matching closing quote.'
  } else if (/non-whitespace character after json/i.test(lower)) {
    kind = 'syntax'
    suggestion =
      'Only one top-level JSON value is allowed. Remove any extra text or data that appears after the closing brace or bracket.'
  } else if (/bad control character|bad escaped character|invalid escape/i.test(lower)) {
    kind = 'quotes'
    suggestion =
      'Escape control characters inside strings. Use \\n for a new line, \\t for a tab, and \\" for a double quote.'
  } else if (atEnd) {
    kind = 'brackets'
    suggestion = missingClosingSuggestion(text)
  } else if ((charAtPosition === '}' || charAtPosition === ']') && beforeTrimmed.endsWith(':')) {
    kind = 'invalid-value'
    suggestion =
      'A value is missing after the colon. Add a string, number, boolean, null, array, or object.'
  } else if (trailingComma && /unexpected token|property name|expected ',' or '}'/i.test(lower)) {
    kind = 'trailing-comma'
    suggestion =
      'Remove the trailing comma before the closing brace or bracket. JSON does not allow trailing commas.'
  } else if (/property name|double-quoted property/i.test(lower)) {
    kind = 'quotes'
    suggestion =
      'Object keys must be wrapped in double quotes, for example { "name": "value" }. Single quotes and bare keys are invalid.'
  } else if (
    /expected ',' or '}'|expected ',' or ']'|after property value|after array element/i.test(lower)
  ) {
    const expectsArrayClose = /expected ',' or ']'/i.test(lower)
    const expectsObjectClose = /expected ',' or '}'/i.test(lower)
    const closeMismatch =
      (expectsArrayClose && charAtPosition === '}') ||
      (expectsObjectClose && charAtPosition === ']')

    if (closeMismatch) {
      kind = 'brackets'
      suggestion =
        'The closing bracket does not match its container. Use "]" for arrays and "}" for objects.'
    } else {
      kind = 'missing-comma'
      suggestion = /array element/i.test(lower)
        ? 'Add a comma between the previous array item and this one.'
        : 'Add a comma between the previous value and this property or entry.'
    }
  } else if (/unexpected token/i.test(lower)) {
    const tokenMatch = message.match(/unexpected token '([^']*)'/i)
    const token = tokenMatch?.[1] ?? charAtPosition

    if (token === "'" || charAtPosition === "'" || precedingChar === "'") {
      kind = 'quotes'
      suggestion =
        'Replace single quotes with double quotes. All JSON strings and keys must use double quotes.'
    } else if ((token === '}' || token === ']') && trailingComma) {
      kind = 'trailing-comma'
      suggestion =
        'Remove the trailing comma before the closing brace or bracket. JSON does not allow trailing commas.'
    } else if (/^(n|u|i|t|f)$/i.test(token) && /nan|undefined|infinity|true|false|null/i.test(message)) {
      kind = 'invalid-value'
      suggestion =
        'JSON only supports strings, numbers, booleans, null, arrays, and objects. Remove comments and invalid values such as NaN, Infinity, or undefined.'
    } else if (token === '/' || precedingChar === '/') {
      kind = 'syntax'
      suggestion = 'Comments are not valid JSON. Remove // line comments and /* block comments */.'
    } else if (token === '}' || token === ']') {
      kind = 'brackets'
      suggestion =
        'This closing character does not match the surrounding JSON. Check for a missing comma, an extra closing character, or an unclosed value.'
    } else {
      kind = 'invalid-value'
      suggestion =
        'Unexpected content found. Strings must be double-quoted, values must be comma-separated, and comments are not allowed.'
    }
  }

  const caret = `${lineText.slice(0, column - 1).replace(/[^\t]/g, ' ')}^`

  return {
    message,
    line,
    column,
    position,
    lineText,
    caret,
    suggestion,
    kind,
  }
}

export function computeStats(value: unknown, text: string): JsonStats {
  const stats: JsonStats = {
    characters: text.length,
    lines: text.length === 0 ? 0 : text.split(/\r\n|\n|\r/).length,
    bytes: encoder.encode(text).length,
    objects: 0,
    arrays: 0,
    keys: 0,
    depth: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
  }

  if (!isContainer(value)) {
    if (value === null) stats.nulls = 1
    else if (typeof value === 'string') stats.strings = 1
    else if (typeof value === 'number') stats.numbers = 1
    else if (typeof value === 'boolean') stats.booleans = 1
    return stats
  }

  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 1 }]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) break

    const node = current.value
    if (Array.isArray(node)) {
      stats.arrays += 1
      stats.depth = Math.max(stats.depth, current.depth)
      for (const item of node) {
        if (isContainer(item)) {
          stack.push({ value: item, depth: current.depth + 1 })
        } else if (item === null) {
          stats.nulls += 1
        } else if (typeof item === 'string') {
          stats.strings += 1
        } else if (typeof item === 'number') {
          stats.numbers += 1
        } else if (typeof item === 'boolean') {
          stats.booleans += 1
        }
      }
      continue
    }

    if (typeof node === 'object' && node !== null) {
      stats.objects += 1
      stats.depth = Math.max(stats.depth, current.depth)
      const entries = Object.entries(node as Record<string, unknown>)
      stats.keys += entries.length
      for (const [, item] of entries) {
        if (isContainer(item)) {
          stack.push({ value: item, depth: current.depth + 1 })
        } else if (item === null) {
          stats.nulls += 1
        } else if (typeof item === 'string') {
          stats.strings += 1
        } else if (typeof item === 'number') {
          stats.numbers += 1
        } else if (typeof item === 'boolean') {
          stats.booleans += 1
        }
      }
    }
  }

  return stats
}

export function emptyResult(): ProcessingResult {
  return {
    ok: true,
    empty: true,
    data: null,
    error: null,
    formatted: '',
    minified: '',
    stats: null,
    inputBytes: 0,
    formattedBytes: 0,
    minifiedBytes: 0,
    reduction: 0,
    durationMs: 0,
  }
}

export function processJson(text: string, options: FormatOptions): ProcessingResult {
  const start = performance.now()

  if (text.trim().length === 0) {
    return emptyResult()
  }

  const inputBytes = encoder.encode(text).length

  try {
    const data: unknown = JSON.parse(text)
    const formatted = formatJson(data, options)
    const minified = minifyJson(data, options)
    const stats = computeStats(data, text)
    const formattedBytes = encoder.encode(formatted).length
    const minifiedBytes = encoder.encode(minified).length
    const reduction =
      inputBytes > 0 ? Math.max(0, Math.round((1 - minifiedBytes / inputBytes) * 100)) : 0

    return {
      ok: true,
      empty: false,
      data,
      error: null,
      formatted,
      minified,
      stats,
      inputBytes,
      formattedBytes,
      minifiedBytes,
      reduction,
      durationMs: Math.round((performance.now() - start) * 10) / 10,
    }
  } catch (error) {
    return {
      ok: false,
      empty: false,
      data: null,
      error: diagnoseJsonError(text, error),
      formatted: '',
      minified: '',
      stats: null,
      inputBytes,
      formattedBytes: 0,
      minifiedBytes: 0,
      reduction: 0,
      durationMs: Math.round((performance.now() - start) * 10) / 10,
    }
  }
}

const byteFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
})

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${byteFormatter.format(bytes / 1024)} KB`
  return `${byteFormatter.format(bytes / (1024 * 1024))} MB`
}

const numberFormatter = new Intl.NumberFormat('en-US')

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}
