import { useCallback, useState } from 'react'
import { formatBytes } from '../lib/json/core'
import { isJsonFile } from '../lib/json/file'
import { buildCsvSample, CONVERT_JSON_SAMPLE } from '../lib/json/sample'
import type { ConversionDirection, Delimiter } from '../lib/json/csv'
import type { ToastTone } from '../types/ui'

const MAX_FILE_BYTES = 20 * 1024 * 1024

export interface ConverterState {
  direction: ConversionDirection
  input: string
  fileName: string | null
  fileSize: number | null
  delimiter: Delimiter
  hasHeader: boolean
  inferTypes: boolean
  includeHeader: boolean
  setDirection: (direction: ConversionDirection) => void
  setInput: (text: string) => void
  replaceInput: (text: string) => void
  setDelimiter: (delimiter: Delimiter) => void
  setHasHeader: (value: boolean) => void
  setInferTypes: (value: boolean) => void
  setIncludeHeader: (value: boolean) => void
  loadFile: (file: File) => Promise<void>
  loadSample: () => void
  clear: () => void
}

type Notify = (message: string, tone?: ToastTone) => void

const delimiters: Delimiter[] = [',', ';', '\t', '|']

function isCsvSample(text: string): boolean {
  return delimiters.some((delimiter) => text === buildCsvSample(delimiter))
}

function isCsvFile(file: File): boolean {
  return (
    file.type === 'text/csv' ||
    file.type === 'text/plain' ||
    file.type === 'application/vnd.ms-excel' ||
    /\.(csv|tsv|txt)$/i.test(file.name) ||
    file.type === ''
  )
}

export function useConverter(onNotify: Notify): ConverterState {
  const [direction, setDirection] = useState<ConversionDirection>('csv-to-json')
  const [input, setInput] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [delimiter, setDelimiterState] = useState<Delimiter>(',')
  const [hasHeader, setHasHeader] = useState(true)
  const [inferTypes, setInferTypes] = useState(true)
  const [includeHeader, setIncludeHeader] = useState(true)

  const replaceInput = useCallback((text: string) => {
    setInput(text)
    setFileName(null)
    setFileSize(null)
  }, [])

  const setDelimiter = useCallback(
    (next: Delimiter) => {
      setDelimiterState(next)

      if (direction === 'csv-to-json' && isCsvSample(input)) {
        setInput(buildCsvSample(next))
        setFileName(null)
        setFileSize(null)
      }
    },
    [direction, input],
  )

  const loadFile = useCallback(
    async (file: File) => {
      const acceptsFile = direction === 'csv-to-json' ? isCsvFile(file) : isJsonFile(file)

      if (!acceptsFile) {
        onNotify(
          direction === 'csv-to-json'
            ? 'That file type is not supported. Choose a .csv file.'
            : 'That file type is not supported. Choose a .json file.',
          'error',
        )
        return
      }

      if (file.size > MAX_FILE_BYTES) {
        onNotify('This file is larger than 20 MB. Try a smaller document.', 'error')
        return
      }

      try {
        const content = await file.text()
        setInput(content)
        setFileName(file.name)
        setFileSize(file.size)
        onNotify(
          content.trim().length === 0
            ? `${file.name} is empty. Paste some content to get started.`
            : `Loaded ${file.name} (${formatBytes(file.size)}).`,
          content.trim().length === 0 ? 'info' : 'success',
        )
      } catch {
        onNotify('The file could not be read. Please try again.', 'error')
      }
    },
    [direction, onNotify],
  )

  const loadSample = useCallback(() => {
    setInput(
      direction === 'csv-to-json' ? buildCsvSample(delimiter) : CONVERT_JSON_SAMPLE,
    )
    setFileName(null)
    setFileSize(null)
    onNotify(direction === 'csv-to-json' ? 'Sample CSV loaded.' : 'Sample JSON loaded.', 'info')
  }, [direction, delimiter, onNotify])

  const clear = useCallback(() => {
    setInput('')
    setFileName(null)
    setFileSize(null)
    onNotify('Converter input cleared.', 'info')
  }, [onNotify])

  return {
    direction,
    input,
    fileName,
    fileSize,
    delimiter,
    hasHeader,
    inferTypes,
    includeHeader,
    setDirection,
    setInput,
    replaceInput,
    setDelimiter,
    setHasHeader,
    setInferTypes,
    setIncludeHeader,
    loadFile,
    loadSample,
    clear,
  }
}
