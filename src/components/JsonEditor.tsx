import { useEffect, useMemo, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { StateEffect, StateField } from '@codemirror/state'
import type { Extension } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import type { BasicSetupOptions } from '@uiw/react-codemirror'
import { cx } from '../lib/cx'

const lightHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: '#6d28d9' },
  { tag: tags.string, color: '#047857' },
  { tag: tags.number, color: '#b45309' },
  { tag: tags.bool, color: '#2563eb' },
  { tag: tags.null, color: '#be123c' },
  { tag: tags.punctuation, color: '#64748b' },
  { tag: tags.invalid, color: '#dc2626', textDecoration: 'underline wavy' },
])

const darkHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: '#c4b5fd' },
  { tag: tags.string, color: '#6ee7b7' },
  { tag: tags.number, color: '#fbbf24' },
  { tag: tags.bool, color: '#60a5fa' },
  { tag: tags.null, color: '#fb7185' },
  { tag: tags.punctuation, color: '#64748b' },
  { tag: tags.invalid, color: '#fda4af', textDecoration: 'underline wavy' },
])

const lightTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: '#1e293b' },
  '&.cm-focused': { outline: 'none' },
  '.cm-content': { caretColor: '#7c3aed' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#7c3aed' },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
  },
  '.cm-activeLine': { backgroundColor: 'rgba(100, 116, 139, 0.045)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#64748b' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: 'none',
  },
  '.cm-tooltip': {
    border: '1px solid rgba(148, 163, 184, 0.25)',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1e293b',
  },
})

const darkTheme = EditorView.theme(
  {
    '&': { backgroundColor: 'transparent', color: '#e2e8f0' },
    '&.cm-focused': { outline: 'none' },
    '.cm-content': { caretColor: '#a78bfa' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#a78bfa' },
    '.cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(139, 92, 246, 0.28)',
    },
    '.cm-activeLine': { backgroundColor: 'rgba(148, 163, 184, 0.05)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#94a3b8' },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: '#475569',
      border: 'none',
    },
    '.cm-tooltip': {
      border: '1px solid rgba(148, 163, 184, 0.16)',
      borderRadius: '8px',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
    },
  },
  { dark: true },
)

const themeExtensions: Record<'light' | 'dark', Extension> = {
  light: [lightTheme, syntaxHighlighting(lightHighlight)],
  dark: [darkTheme, syntaxHighlighting(darkHighlight)],
}

const setErrorLine = StateEffect.define<number | null>()

const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    const mapped = decorations.map(transaction.changes)

    for (const effect of transaction.effects) {
      if (effect.is(setErrorLine)) {
        if (effect.value == null) return Decoration.none
        const lineNumber = Math.min(
          Math.max(effect.value, 1),
          transaction.state.doc.lines,
        )
        const line = transaction.state.doc.line(lineNumber)
        return Decoration.set([
          Decoration.line({ class: 'cm-error-line' }).range(line.from),
        ])
      }
    }

    return mapped
  },
  provide: (field) => EditorView.decorations.from(field),
})

interface JsonEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  dark: boolean
  errorLine?: number | null
  placeholder?: string
  ariaLabel: string
  className?: string
}

export function JsonEditor({
  value,
  onChange,
  readOnly = false,
  dark,
  errorLine = null,
  placeholder,
  ariaLabel,
  className,
}: JsonEditorProps) {
  const viewRef = useRef<EditorView | null>(null)

  const extensions = useMemo<Extension[]>(
    () => [
      json(),
      errorLineField,
      EditorView.contentAttributes.of({
        'aria-label': ariaLabel,
        spellcheck: 'false',
        autocapitalize: 'off',
        autocorrect: 'off',
      }),
    ],
    [ariaLabel],
  )

  const basicSetup = useMemo<BasicSetupOptions>(
    () => ({
      lineNumbers: true,
      foldGutter: !readOnly,
      highlightActiveLine: !readOnly,
      highlightActiveLineGutter: !readOnly,
      bracketMatching: true,
      closeBrackets: !readOnly,
      autocompletion: false,
      highlightSelectionMatches: !readOnly,
      searchKeymap: true,
      history: !readOnly,
      indentOnInput: !readOnly,
    }),
    [readOnly],
  )

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({ effects: setErrorLine.of(errorLine) })
  }, [errorLine, value])

  return (
    <div className={cx('editor-shell h-full overflow-hidden text-left', className)}>
      <CodeMirror
        value={value}
        height="100%"
        theme={themeExtensions[dark ? 'dark' : 'light']}
        extensions={extensions}
        basicSetup={basicSetup}
        editable={!readOnly}
        readOnly={readOnly}
        indentWithTab={!readOnly}
        placeholder={placeholder}
        onChange={onChange ? (nextValue) => onChange(nextValue) : undefined}
        onCreateEditor={(view) => {
          viewRef.current = view
          if (errorLine != null) {
            view.dispatch({ effects: setErrorLine.of(errorLine) })
          }
        }}
        className="h-full"
      />
    </div>
  )
}
