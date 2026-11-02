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

export const EMPTY_INPUT = ''
