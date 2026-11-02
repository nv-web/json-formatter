export const SAMPLE_JSON = `{
  "project": "JSONify",
  "version": "1.0.0",
  "private": true,
  "features": ["format", "validate", "minify", "tree view", "statistics"],
  "config": {
    "theme": "system",
    "indentation": 2,
    "sortKeys": false,
    "worker": {
      "enabled": true,
      "pool": 1
    }
  },
  "contributors": [
    {
      "name": "Ada Lovelace",
      "role": "maintainer",
      "commits": 512,
      "active": true
    },
    {
      "name": "Grace Hopper",
      "role": "core",
      "commits": 408,
      "active": true
    }
  ],
  "license": "MIT",
  "deprecated": null,
  "benchmarks": {
    "parseMs": 12.4,
    "formatMs": 18.7,
    "memoryMb": 42
  },
  "unicode": "Ships safely — 100% client-side",
  "emptyObject": {},
  "emptyArray": []
}
`

export const COMPARE_SAMPLE_A = `{
  "project": "JSONify",
  "version": "1.0.0",
  "features": ["format", "validate", "minify"],
  "config": {
    "theme": "system",
    "indentation": 2,
    "sortKeys": false
  },
  "contributors": [
    {
      "name": "Ada Lovelace",
      "role": "maintainer",
      "commits": 512
    },
    {
      "name": "Grace Hopper",
      "role": "core",
      "commits": 408
    }
  ],
  "license": "MIT",
  "deprecated": null
}
`

export const COMPARE_SAMPLE_B = `{
  "project": "JSONify",
  "version": "1.1.0",
  "features": ["format", "validate", "minify", "compare"],
  "config": {
    "theme": "dark",
    "indentation": 4,
    "sortKeys": true,
    "workers": 2
  },
  "contributors": [
    {
      "name": "Ada Lovelace",
      "role": "maintainer",
      "commits": 640
    },
    {
      "name": "Grace Hopper",
      "role": "core",
      "commits": 408
    },
    {
      "name": "Alan Turing",
      "role": "advisor",
      "commits": 96
    }
  ],
  "license": "Apache-2.0"
}
`

import type { Delimiter } from './csv'

const csvSampleRows = [
  ['name', 'role', 'commits', 'active'],
  ['Ada Lovelace', 'maintainer', '512', 'true'],
  ['Grace Hopper', 'core', '408', 'true'],
  ['Alan Turing', 'advisor', '96', 'false'],
  ['Katherine Johnson', 'contributor', '274', 'true'],
]

function escapeCsvCell(value: string, delimiter: Delimiter): string {
  const needsQuotes =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r') ||
    value.trim() !== value

  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value
}

export function buildCsvSample(delimiter: Delimiter): string {
  return `${csvSampleRows
    .map((row) => row.map((cell) => escapeCsvCell(cell, delimiter)).join(delimiter))
    .join('\n')}\n`
}

export const CONVERT_CSV_SAMPLE = buildCsvSample(',')

export const CONVERT_JSON_SAMPLE = `[
  {
    "name": "Ada Lovelace",
    "role": "maintainer",
    "commits": 512,
    "active": true
  },
  {
    "name": "Grace Hopper",
    "role": "core",
    "commits": 408,
    "active": true
  },
  {
    "name": "Alan Turing",
    "role": "advisor",
    "commits": 96,
    "active": false
  }
]
`

export const SCHEMA_SAMPLE = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "User",
  "type": "object",
  "required": ["id", "name", "email", "active"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "minLength": 3, "maxLength": 40 },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 18, "maximum": 80 },
    "role": { "type": "string", "enum": ["admin", "editor", "viewer"] },
    "active": { "type": "boolean" },
    "website": { "type": "string", "format": "uri" },
    "tags": {
      "type": "array",
      "minItems": 2,
      "maxItems": 4,
      "items": { "type": "string" }
    },
    "address": { "$ref": "#/$defs/address" },
    "subscription": {
      "oneOf": [
        {
          "type": "object",
          "required": ["plan"],
          "properties": { "plan": { "const": "free" } }
        },
        {
          "type": "object",
          "required": ["plan", "seats"],
          "properties": {
            "plan": { "const": "pro" },
            "seats": { "type": "integer", "minimum": 1, "maximum": 50 }
          }
        }
      ]
    }
  },
  "$defs": {
    "address": {
      "type": "object",
      "required": ["street", "city", "country"],
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "postalCode": { "type": "string" },
        "country": { "type": "string" }
      }
    }
  }
}
`

export const SCHEMA_DOCUMENT_SAMPLE = `{
  "order": {
    "id": "ORD-10482",
    "placedAt": "2026-10-31T14:25:00Z",
    "customer": {
      "name": "Aarav Mehta",
      "contact": {
        "email": "aarav@example.com",
        "phone": "+91-98765-43210"
      },
      "addresses": [
        {
          "type": "shipping",
          "city": "Pune",
          "postalCode": "411001"
        }
      ]
    },
    "items": [
      {
        "sku": "BK-204",
        "product": {
          "name": "The Paper Garden",
          "category": {
            "name": "Books",
            "department": "Lifestyle"
          }
        },
        "quantity": 2,
        "price": {
          "amount": 18.5,
          "currency": "USD"
        }
      }
    ],
    "payment": {
      "method": "card",
      "status": "paid",
      "billingAddress": {
        "city": "Pune",
        "country": "India"
      }
    },
    "metadata": {
      "gift": false,
      "notes": null
    }
  }
}
`

export const EMPTY_INPUT = ''
