export type Theme = 'light' | 'dark'

export type Screen = 'home' | 'formatter' | 'compare' | 'convert' | 'schema' | 'docs'

export type OutputMode = 'formatted' | 'minified'

export type ValidationState = 'empty' | 'valid' | 'invalid'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  tone: ToastTone
  message: string
}
