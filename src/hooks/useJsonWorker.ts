import { useCallback, useEffect, useRef, useState } from 'react'
import { processJson } from '../lib/json/core'
import type {
  FormatOptions,
  JsonWorkerRequest,
  JsonWorkerResponse,
  ProcessingResult,
} from '../types/json'

const DEBOUNCE_MS = 260

export function useJsonWorker(text: string, options: FormatOptions) {
  const [result, setResult] = useState<ProcessingResult>(() => processJson(text, options))
  const [isProcessing, setIsProcessing] = useState(false)
  const [workerFailed, setWorkerFailed] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)

  const workerRef = useRef<Worker | null>(null)
  const requestRef = useRef(0)
  const mountedRef = useRef(true)
  const firstRunRef = useRef(true)
  const refreshRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let worker: Worker | null = null

    try {
      worker = new Worker(new URL('../workers/json.worker.ts', import.meta.url), {
        type: 'module',
      })

      worker.onmessage = (event: MessageEvent<JsonWorkerResponse>) => {
        if (!mountedRef.current || event.data.id !== requestRef.current) return
        setResult(event.data.result)
        setIsProcessing(false)
      }

      worker.onerror = () => {
        worker?.terminate()
        if (workerRef.current === worker) workerRef.current = null
        if (mountedRef.current) setWorkerFailed(true)
      }

      workerRef.current = worker
    } catch {
      setWorkerFailed(true)
    }

    return () => {
      worker?.terminate()
      if (workerRef.current === worker) workerRef.current = null
    }
  }, [])

  useEffect(() => {
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setIsProcessing(true)

    const immediate = firstRunRef.current || refreshRef.current
    firstRunRef.current = false
    refreshRef.current = false

    const timer = window.setTimeout(
      () => {
        const worker = workerRef.current

        if (worker && !workerFailed) {
          const request: JsonWorkerRequest = { id: requestId, text, options }
          worker.postMessage(request)
          return
        }

        const fallback = processJson(text, options)
        if (mountedRef.current && requestRef.current === requestId) {
          setResult(fallback)
          setIsProcessing(false)
        }
      },
      immediate ? 0 : DEBOUNCE_MS,
    )

    return () => window.clearTimeout(timer)
  }, [text, options, workerFailed, refreshToken])

  const refresh = useCallback(() => {
    refreshRef.current = true
    setRefreshToken((token) => token + 1)
  }, [])

  return { result, isProcessing, refresh, workerFailed }
}
