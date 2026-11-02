import { diagnoseJsonError } from './core'
import type { JsonErrorInfo } from '../../types/json'

export interface SchemaGenerationOptions {
  count: number
  includeOptional: boolean
  seed: number
}

export interface SchemaGenerationResult {
  ok: boolean
  empty: boolean
  output: string
  error: string | null
  jsonError: JsonErrorInfo | null
  exampleCount: number
  inputBytes: number
  outputBytes: number
  durationMs: number
}

const encoder = new TextEncoder()

const firstNameHints = ['Ada', 'Grace', 'Alan', 'Katherine', 'Linus', 'Barbara', 'Dennis', 'Margaret']
const lastNameHints = ['Lovelace', 'Hopper', 'Turing', 'Johnson', 'Torvalds', 'Liskov', 'Ritchie', 'Hamilton']
const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india']

const validTypes = new Set(['null', 'boolean', 'object', 'array', 'number', 'string', 'integer'])

const schemaKeywords = new Set([
  '$schema',
  '$id',
  '$ref',
  '$defs',
  'definitions',
  'properties',
  'patternProperties',
  'additionalProperties',
  'items',
  'prefixItems',
  'contains',
  'required',
  'oneOf',
  'anyOf',
  'allOf',
  'not',
  'enum',
  'const',
  'format',
  'title',
  'description',
  'default',
  'examples',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minLength',
  'maxLength',
  'pattern',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minProperties',
  'maxProperties',
  'dependentRequired',
  'dependencies',
  'if',
  'then',
  'else',
])

interface GenContext {
  root: unknown
  rng: () => number
  includeOptional: boolean
  refStack: Set<string>
  depth: number
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function randomInt(context: GenContext, min: number, max: number): number {
  return Math.floor(context.rng() * (max - min + 1)) + min
}

function pick<T>(context: GenContext, values: T[]): T {
  return values[randomInt(context, 0, values.length - 1)]
}

function numberOr(value: unknown, fallback: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function resolveRef(ref: string, root: unknown): unknown {
  if (ref === '#') return root
  if (!ref.startsWith('#/')) {
    throw new Error(`Unsupported external $ref "${ref}". Only local references are supported.`)
  }

  const segments = ref
    .slice(2)
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))

  let current: unknown = root

  for (const segment of segments) {
    if (!isPlainObject(current) && !Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

function mergeAllOf(schemas: unknown[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  const properties: Record<string, unknown> = {}
  const required = new Set<string>()
  let hasProperties = false

  for (const item of schemas) {
    if (!isPlainObject(item)) continue

    for (const [key, value] of Object.entries(item)) {
      if (key === 'properties' && isPlainObject(value)) {
        Object.assign(properties, value)
        hasProperties = true
      } else if (key === 'required' && Array.isArray(value)) {
        for (const entry of value) if (typeof entry === 'string') required.add(entry)
      } else if (key !== 'allOf') {
        merged[key] = value
      }
    }
  }

  if (hasProperties) merged.properties = properties
  if (required.size > 0) merged.required = Array.from(required)

  return merged
}

function inferType(schema: Record<string, unknown>): string {
  const raw = schema.type

  if (typeof raw === 'string') return raw

  if (Array.isArray(raw)) {
    const found = raw.find((entry) => typeof entry === 'string' && entry !== 'null')
    if (typeof found === 'string') return found
    return 'null'
  }

  if (isPlainObject(schema.properties) || schema.additionalProperties !== undefined) return 'object'
  if (schema.items !== undefined) return 'array'
  if (
    schema.format !== undefined ||
    schema.pattern !== undefined ||
    schema.minLength !== undefined ||
    schema.maxLength !== undefined
  ) {
    return 'string'
  }
  if (
    schema.minimum !== undefined ||
    schema.maximum !== undefined ||
    schema.exclusiveMinimum !== undefined ||
    schema.exclusiveMaximum !== undefined ||
    schema.multipleOf !== undefined
  ) {
    return 'number'
  }

  return 'object'
}

function formatString(context: GenContext, format: string): string {
  switch (format) {
    case 'email':
      return `${pick(context, firstNameHints).toLowerCase()}.${pick(context, lastNameHints).toLowerCase()}@example.com`
    case 'date':
      return `2026-${String(randomInt(context, 1, 12)).padStart(2, '0')}-${String(randomInt(context, 1, 28)).padStart(2, '0')}`
    case 'date-time':
      return new Date(Date.UTC(2026, randomInt(context, 0, 11), randomInt(context, 1, 28))).toISOString()
    case 'time':
      return `${String(randomInt(context, 0, 23)).padStart(2, '0')}:${String(randomInt(context, 0, 59)).padStart(2, '0')}:00`
    case 'uuid':
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
        const value = randomInt(context, 0, 15)
        const digit = character === 'x' ? value : (value & 0x3) | 0x8
        return digit.toString(16)
      })
    case 'uri':
    case 'url':
      return `https://example.com/${pick(context, words)}/${randomInt(context, 1, 999)}`
    case 'hostname':
      return `${pick(context, words)}.example.com`
    case 'ipv4':
      return `192.168.${randomInt(context, 0, 255)}.${randomInt(context, 1, 254)}`
    case 'ipv6':
      return '2001:db8::1'
    case 'regex':
      return '^[a-z]+$'
    default:
      return ''
  }
}

function hintString(context: GenContext, key: string): string {
  const name = key.toLowerCase()

  if (name.includes('first') && name.includes('name')) return pick(context, firstNameHints)
  if (name.includes('last') && name.includes('name')) return pick(context, lastNameHints)
  if (name.includes('name')) return `${pick(context, firstNameHints)} ${pick(context, lastNameHints)}`
  if (name.includes('email')) return `${pick(context, firstNameHints).toLowerCase()}@example.com`
  if (name.includes('phone')) return `+1-555-${String(randomInt(context, 100, 999))}-${String(randomInt(context, 1000, 9999))}`
  if (name.includes('city')) return pick(context, ['London', 'Paris', 'Tokyo', 'Berlin', 'Toronto'])
  if (name.includes('country')) return pick(context, ['United Kingdom', 'France', 'Japan', 'Germany', 'Canada'])
  if (name.includes('company')) return `${pick(context, lastNameHints)} Labs`
  if (name.includes('url') || name.includes('uri') || name.includes('link')) {
    return `https://example.com/${pick(context, words)}`
  }
  if (name.includes('title') || name.includes('label')) return `${pick(context, words)} ${pick(context, words)}`
  if (name.includes('description') || name.includes('summary') || name.includes('bio')) {
    return `A short description about ${pick(context, words)}.`
  }
  if (name.includes('currency')) return pick(context, ['USD', 'EUR', 'GBP', 'INR', 'JPY'])
  if (name.includes('status')) return pick(context, ['paid', 'pending', 'shipped', 'delivered', 'refunded'])
  if (name.includes('method')) return pick(context, ['card', 'paypal', 'bank_transfer', 'cash'])
  if (name.includes('sku')) return `${randomLetters(context, 2)}-${randomInt(context, 100, 999)}`
  if (name.includes('postal') || name.includes('zip')) return String(randomInt(context, 10000, 999999))
  if (name.includes('category')) return pick(context, ['Books', 'Electronics', 'Home', 'Fashion', 'Sports'])
  if (name.includes('department')) return pick(context, ['Lifestyle', 'Technology', 'Groceries', 'Beauty'])
  if (name.includes('type') || name.includes('kind')) return pick(context, ['shipping', 'billing', 'home', 'work'])
  if (name.includes('id')) return `${pick(context, words)}-${randomInt(context, 1000, 9999)}`

  return `${pick(context, words)}-${pick(context, words)}`
}

function randomLetters(context: GenContext, length: number): string {
  let output = ''
  for (let index = 0; index < length; index += 1) {
    output += String.fromCharCode(65 + randomInt(context, 0, 25))
  }
  return output
}

function generateString(
  schema: Record<string, unknown>,
  context: GenContext,
  key: string,
): string {
  const format = typeof schema.format === 'string' ? schema.format : ''
  let value = format.length > 0 ? formatString(context, format) : ''
  if (value.length === 0) value = hintString(context, key)

  const minLength = numberOr(schema.minLength, 0) ?? 0
  const maxLength = numberOr(schema.maxLength, undefined)

  if (value.length < minLength) {
    while (value.length < minLength) value += pick(context, words)
  }

  if (maxLength !== undefined && value.length > maxLength) {
    value = value.slice(0, Math.max(0, Math.floor(maxLength)))
  }

  if (value.length === 0) value = pick(context, words)

  return value
}

function generateNumber(
  schema: Record<string, unknown>,
  context: GenContext,
  integer: boolean,
  key: string,
): number {
  const minimum = numberOr(schema.minimum, undefined)
  const maximum = numberOr(schema.maximum, undefined)
  const exclusiveMinimum = numberOr(schema.exclusiveMinimum, undefined)
  const exclusiveMaximum = numberOr(schema.exclusiveMaximum, undefined)

  let low = minimum ?? (exclusiveMinimum !== undefined ? exclusiveMinimum + (integer ? 1 : 0.01) : 0)
  let high =
    maximum ?? (exclusiveMaximum !== undefined ? exclusiveMaximum - (integer ? 1 : 0.01) : low + 100)

  if (minimum === undefined && maximum === undefined && exclusiveMinimum === undefined && exclusiveMaximum === undefined) {
    const name = key.toLowerCase()
    if (name.includes('quantity') || name.includes('count')) {
      low = 1
      high = 10
    } else if (name.includes('age')) {
      low = 18
      high = 80
    } else if (name.includes('price') || name.includes('amount') || name.includes('total')) {
      low = 1
      high = 500
    } else if (name.includes('year')) {
      low = 2020
      high = 2026
    }
  }

  if (high < low) [low, high] = [high, low]

  let value = low + context.rng() * (high - low)
  if (integer) value = Math.round(value)

  const multipleOf = numberOr(schema.multipleOf, undefined)
  if (multipleOf !== undefined && multipleOf > 0) {
    value = Math.round(value / multipleOf) * multipleOf
  }

  if (integer) value = Math.round(value)
  if (value < low) value = low
  if (value > high) value = high

  return Number(value.toFixed(integer ? 0 : 2))
}

function generateArray(schema: Record<string, unknown>, context: GenContext, key: string): unknown[] {
  const items = schema.items
  const minItems = Math.max(0, Math.floor(numberOr(schema.minItems, 0) ?? 0))
  const maxItems = Math.max(minItems, Math.floor(numberOr(schema.maxItems, Math.max(minItems, 3)) ?? 3))
  const target = Math.max(minItems, Math.min(maxItems, Math.max(minItems, 2)))
  const length = Math.min(target, 25)

  if (Array.isArray(items)) {
    return items
      .slice(0, Math.max(length, items.length))
      .map((item, index) => generateValue(item, context, `${key}${index}`))
  }

  if (items === undefined) return []

  const output: unknown[] = []
  for (let index = 0; index < length; index += 1) {
    output.push(generateValue(items, context, key))
  }
  return output
}

function generateObject(schema: Record<string, unknown>, context: GenContext): Record<string, unknown> {
  const properties = isPlainObject(schema.properties) ? schema.properties : {}
  const required = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter((entry): entry is string => typeof entry === 'string')
      : [],
  )
  const output: Record<string, unknown> = {}

  for (const [name, propertySchema] of Object.entries(properties)) {
    if (!required.has(name) && !context.includeOptional) continue
    output[name] = generateValue(propertySchema, context, name)
  }

  if (Object.keys(output).length === 0 && isPlainObject(schema.additionalProperties)) {
    output.key1 = generateValue(schema.additionalProperties, context, 'key1')
    output.key2 = generateValue(schema.additionalProperties, context, 'key2')
  }

  return output
}

function generateValue(schema: unknown, context: GenContext, key: string): unknown {
  if (context.depth > 20) return null
  if (schema === true) return {}
  if (schema === false) return null
  if (!isPlainObject(schema)) return null

  const child: GenContext = { ...context, depth: context.depth + 1 }

  if (typeof schema.$ref === 'string') {
    const ref = schema.$ref

    if (context.refStack.has(ref)) return {}
    if (context.refStack.size > 12) return {}

    const resolved = resolveRef(ref, context.root)
    if (resolved === undefined) {
      throw new Error(`Unresolved $ref "${ref}". Check that the definition exists.`)
    }

    const nextStack = new Set(context.refStack)
    nextStack.add(ref)
    return generateValue(resolved, { ...child, refStack: nextStack }, key)
  }

  if ('const' in schema) return schema.const

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[randomInt(context, 0, schema.enum.length - 1)]
  }

  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return schema.examples[randomInt(context, 0, schema.examples.length - 1)]
  }

  if ('default' in schema) return schema.default

  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    return generateValue(mergeAllOf(schema.allOf), child, key)
  }

  const alternatives = Array.isArray(schema.oneOf)
    ? schema.oneOf
    : Array.isArray(schema.anyOf)
      ? schema.anyOf
      : null

  if (alternatives && alternatives.length > 0) {
    return generateValue(alternatives[randomInt(context, 0, alternatives.length - 1)], child, key)
  }

  switch (inferType(schema)) {
    case 'string':
      return generateString(schema, context, key)
    case 'integer':
      return generateNumber(schema, context, true, key)
    case 'number':
      return generateNumber(schema, context, false, key)
    case 'boolean':
      return context.rng() > 0.5
    case 'null':
      return null
    case 'array':
      return generateArray(schema, context, key)
    case 'object':
      return generateObject(schema, child)
    default:
      return null
  }
}

export function isJsonSchema(value: unknown): boolean {
  if (typeof value === 'boolean') return true
  if (!isPlainObject(value)) return false

  if (typeof value.$schema === 'string') return true
  if (typeof value.$ref === 'string') return true
  if (isPlainObject(value.$defs) || isPlainObject(value.definitions)) return true
  if (isPlainObject(value.properties)) return true
  if (Array.isArray(value.required)) return true
  if (Array.isArray(value.oneOf) || Array.isArray(value.anyOf) || Array.isArray(value.allOf)) return true
  if (Array.isArray(value.enum) || 'const' in value) return true
  if (isPlainObject(value.patternProperties) || isPlainObject(value.additionalProperties)) return true
  if ('not' in value || 'if' in value) return true

  const type = value.type
  const validType =
    (typeof type === 'string' && validTypes.has(type)) ||
    (Array.isArray(type) &&
      type.length > 0 &&
      type.every((entry) => typeof entry === 'string' && validTypes.has(entry)))

  if (validType) {
    return Object.keys(value).every((key) => schemaKeywords.has(key))
  }

  return false
}

function inferFormat(value: string): string | undefined {
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'email'
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'date-time'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return 'uuid'
  }
  if (/^https?:\/\//.test(value)) return 'uri'
  return undefined
}

export function inferSchemaFromValue(value: unknown): Record<string, unknown> {
  if (value === null) return { type: 'null' }

  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? inferSchemaFromValue(value[0]) : {},
      minItems: value.length,
      maxItems: value.length,
    }
  }

  if (isPlainObject(value)) {
    const properties: Record<string, unknown> = {}
    const required: string[] = []

    for (const [key, child] of Object.entries(value)) {
      properties[key] = inferSchemaFromValue(child)
      required.push(key)
    }

    return { type: 'object', properties, required }
  }

  if (typeof value === 'string') {
    const format = inferFormat(value)
    return format ? { type: 'string', format } : { type: 'string' }
  }

  if (typeof value === 'number') {
    return { type: Number.isInteger(value) ? 'integer' : 'number' }
  }

  if (typeof value === 'boolean') return { type: 'boolean' }

  return {}
}

function emptyResult(): SchemaGenerationResult {
  return {
    ok: true,
    empty: true,
    output: '',
    error: null,
    jsonError: null,
    exampleCount: 0,
    inputBytes: 0,
    outputBytes: 0,
    durationMs: 0,
  }
}

export function generateFromSchema(
  text: string,
  options: SchemaGenerationOptions,
): SchemaGenerationResult {
  const start = performance.now()

  if (text.trim().length === 0) return emptyResult()

  let schema: unknown

  try {
    schema = JSON.parse(text)
  } catch (error) {
    const jsonError = diagnoseJsonError(text, error)
    return {
      ok: false,
      empty: false,
      output: '',
      error: jsonError.message,
      jsonError,
      exampleCount: 0,
      inputBytes: encoder.encode(text).length,
      outputBytes: 0,
      durationMs: Math.round((performance.now() - start) * 10) / 10,
    }
  }

  const sourceSchema = isJsonSchema(schema) ? schema : inferSchemaFromValue(schema)

  const count = Math.min(Math.max(Math.floor(options.count), 1), 25)
  const rng = mulberry32(options.seed)
  const examples: unknown[] = []

  try {
    for (let index = 0; index < count; index += 1) {
      const context: GenContext = {
        root: sourceSchema,
        rng,
        includeOptional: options.includeOptional,
        refStack: new Set<string>(),
        depth: 0,
      }
      examples.push(generateValue(sourceSchema, context, ''))
    }
  } catch (error) {
    return {
      ok: false,
      empty: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
      jsonError: null,
      exampleCount: 0,
      inputBytes: encoder.encode(text).length,
      outputBytes: 0,
      durationMs: Math.round((performance.now() - start) * 10) / 10,
    }
  }

  const output = JSON.stringify(count === 1 ? examples[0] : examples, null, 2)

  return {
    ok: true,
    empty: false,
    output,
    error: null,
    jsonError: null,
    exampleCount: count,
    inputBytes: encoder.encode(text).length,
    outputBytes: encoder.encode(output).length,
    durationMs: Math.round((performance.now() - start) * 10) / 10,
  }
}
