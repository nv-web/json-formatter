import { useCallback, useState } from 'react'
import { formatBytes } from '../lib/json/core'
import { isJsonFile } from '../lib/json/file'
import { SCHEMA_DOCUMENT_SAMPLE, SCHEMA_SAMPLE } from '../lib/json/sample'
import type { ToastTone } from '../types/ui'

const MAX_FILE_BYTES = 20 * 1024 * 1024

export interface SchemaGeneratorState {
  schemaText: string
  fileName: string | null
  fileSize: number | null
  count: number
  includeOptional: boolean
  seed: number
  setSchemaText: (text: string) => void
  setCount: (count: number) => void
  setIncludeOptional: (value: boolean) => void
  regenerate: () => void
  loadFile: (file: File) => Promise<void>
  loadSample: () => void
  loadDocumentSample: () => void
  clear: () => void
}

type Notify = (message: string, tone?: ToastTone) => void

export function useSchemaGenerator(onNotify: Notify): SchemaGeneratorState {
  const [schemaText, setSchemaText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [count, setCount] = useState(3)
  const [includeOptional, setIncludeOptional] = useState(true)
  const [seed, setSeed] = useState(42)

  const regenerate = useCallback(() => {
    setSeed((previous) => (previous + 1) >>> 0)
  }, [])

  const loadFile = useCallback(
    async (file: File) => {
      if (!isJsonFile(file)) {
        onNotify('That file type is not supported. Choose a .json schema file.', 'error')
        return
      }

      if (file.size > MAX_FILE_BYTES) {
        onNotify('This file is larger than 20 MB. Try a smaller schema.', 'error')
        return
      }

      try {
        const content = await file.text()
        setSchemaText(content)
        setFileName(file.name)
        setFileSize(file.size)
        onNotify(
          content.trim().length === 0
            ? `${file.name} is empty. Paste a schema to get started.`
            : `Loaded ${file.name} (${formatBytes(file.size)}).`,
          content.trim().length === 0 ? 'info' : 'success',
        )
      } catch {
        onNotify('The file could not be read. Please try again.', 'error')
      }
    },
    [onNotify],
  )

  const loadSample = useCallback(() => {
    setSchemaText(SCHEMA_SAMPLE)
    setFileName(null)
    setFileSize(null)
    onNotify('Sample schema loaded.', 'info')
  }, [onNotify])

  const loadDocumentSample = useCallback(() => {
    setSchemaText(SCHEMA_DOCUMENT_SAMPLE)
    setFileName(null)
    setFileSize(null)
    onNotify('Sample document loaded. A schema was inferred from its shape.', 'info')
  }, [onNotify])

  const clear = useCallback(() => {
    setSchemaText('')
    setFileName(null)
    setFileSize(null)
    onNotify('Schema input cleared.', 'info')
  }, [onNotify])

  return {
    schemaText,
    fileName,
    fileSize,
    count,
    includeOptional,
    seed,
    setSchemaText,
    setCount,
    setIncludeOptional,
    regenerate,
    loadFile,
    loadSample,
    loadDocumentSample,
    clear,
  }
}
