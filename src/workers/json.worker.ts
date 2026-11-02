import { processJson } from '../lib/json/core'
import type { JsonWorkerRequest, JsonWorkerResponse } from '../types/json'

interface WorkerScope {
  onmessage: ((event: MessageEvent<JsonWorkerRequest>) => void) | null
  postMessage: (message: JsonWorkerResponse) => void
}

const scope = self as unknown as WorkerScope

scope.onmessage = (event: MessageEvent<JsonWorkerRequest>) => {
  const { id, text, options } = event.data
  const result = processJson(text, options)
  scope.postMessage({ id, result })
}
