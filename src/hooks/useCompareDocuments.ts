import { useCallback, useState } from 'react'
import { formatBytes } from '../lib/json/core'
import { isJsonFile } from '../lib/json/file'
import { COMPARE_SAMPLE_A, COMPARE_SAMPLE_B } from '../lib/json/sample'
import type { ToastTone } from '../types/ui'

const MAX_FILE_BYTES = 20 * 1024 * 1024

export interface CompareFileInfo {
  name: string
  size: number
}

export type CompareSide = 'left' | 'right'

export interface CompareDocuments {
  leftText: string
  rightText: string
  leftFile: CompareFileInfo | null
  rightFile: CompareFileInfo | null
  setLeftText: (text: string) => void
  setRightText: (text: string) => void
  loadFile: (side: CompareSide, file: File) => Promise<void>
  clearSide: (side: CompareSide) => void
  loadSample: (side: CompareSide) => void
  loadPair: () => void
  clearAll: () => void
  swap: () => void
}

type Notify = (message: string, tone?: ToastTone) => void

export function useCompareDocuments(onNotify: Notify): CompareDocuments {
  const [leftText, setLeftText] = useState('')
  const [rightText, setRightText] = useState('')
  const [leftFile, setLeftFile] = useState<CompareFileInfo | null>(null)
  const [rightFile, setRightFile] = useState<CompareFileInfo | null>(null)

  const loadFile = useCallback(
    async (side: CompareSide, file: File) => {
      if (!isJsonFile(file)) {
        onNotify('That file type is not supported. Choose a .json file.', 'error')
        return
      }

      if (file.size > MAX_FILE_BYTES) {
        onNotify('This file is larger than 20 MB. Try a smaller document.', 'error')
        return
      }

      const label = side === 'left' ? 'Original' : 'Modified'

      try {
        const content = await file.text()
        if (side === 'left') {
          setLeftText(content)
          setLeftFile({ name: file.name, size: file.size })
        } else {
          setRightText(content)
          setRightFile({ name: file.name, size: file.size })
        }

        onNotify(
          content.trim().length === 0
            ? `${file.name} is empty. Paste some JSON to get started.`
            : `Loaded ${file.name} (${formatBytes(file.size)}) into ${label}.`,
          content.trim().length === 0 ? 'info' : 'success',
        )
      } catch {
        onNotify('The file could not be read. Please try again.', 'error')
      }
    },
    [onNotify],
  )

  const clearSide = useCallback(
    (side: CompareSide) => {
      if (side === 'left') {
        setLeftText('')
        setLeftFile(null)
      } else {
        setRightText('')
        setRightFile(null)
      }
      onNotify(`Cleared the ${side === 'left' ? 'Original' : 'Modified'} side.`, 'info')
    },
    [onNotify],
  )

  const loadSample = useCallback(
    (side: CompareSide) => {
      if (side === 'left') {
        setLeftText(COMPARE_SAMPLE_A)
        setLeftFile(null)
      } else {
        setRightText(COMPARE_SAMPLE_B)
        setRightFile(null)
      }
      onNotify('Sample JSON loaded.', 'info')
    },
    [onNotify],
  )

  const loadPair = useCallback(() => {
    setLeftText(COMPARE_SAMPLE_A)
    setRightText(COMPARE_SAMPLE_B)
    setLeftFile(null)
    setRightFile(null)
    onNotify('Sample pair loaded.', 'info')
  }, [onNotify])

  const clearAll = useCallback(() => {
    setLeftText('')
    setRightText('')
    setLeftFile(null)
    setRightFile(null)
    onNotify('Comparison cleared.', 'info')
  }, [onNotify])

  const swap = useCallback(() => {
    setLeftText(rightText)
    setRightText(leftText)
    setLeftFile(rightFile)
    setRightFile(leftFile)
    onNotify('Swapped the two documents.', 'info')
  }, [leftText, rightText, leftFile, rightFile, onNotify])

  return {
    leftText,
    rightText,
    leftFile,
    rightFile,
    setLeftText,
    setRightText,
    loadFile,
    clearSide,
    loadSample,
    loadPair,
    clearAll,
    swap,
  }
}
