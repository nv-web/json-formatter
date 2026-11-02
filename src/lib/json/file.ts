export function sanitizeFilename(name: string): string {
  const withoutControlCharacters = Array.from(name)
    .map((character) => (character.charCodeAt(0) < 32 ? '-' : character))
    .join('')

  const cleaned = withoutControlCharacters
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .trim()

  if (cleaned.length === 0) return 'formatted-json.json'
  return /\.json$/i.test(cleaned) ? cleaned : `${cleaned}.json`
}

export function baseNameOf(filename: string): string {
  return filename.replace(/\.json$/i, '') || 'json'
}

export function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = sanitizeFilename(filename)
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    const succeeded = document.execCommand('copy')
    if (!succeeded) throw new Error('Copy command was rejected by the browser.')
  } finally {
    textarea.remove()
  }
}

export function isJsonFile(file: File): boolean {
  return (
    file.type === 'application/json' ||
    file.type === 'text/json' ||
    /\.json$/i.test(file.name) ||
    file.type === 'text/plain' ||
    file.type === ''
  )
}

export function countLines(text: string): number {
  return text.length === 0 ? 0 : text.split(/\r\n|\n|\r/).length
}
