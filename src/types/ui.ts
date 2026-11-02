export type Theme = 'light' | 'dark'

export type OutputMode = 'formatted' | 'minified'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  tone: ToastTone
  message: string
}
