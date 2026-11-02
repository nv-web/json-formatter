import {
  BookOpen,
  Cpu,
  Keyboard,
  Lock,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react'

const steps = [
  'Paste JSON into the input editor, drag a .json file onto it, or use the sample.',
  'Pick an indentation style and toggle key sorting, nested formatting, or compact arrays.',
  'Copy the result, download it as a .json file, or inspect it in the tree and statistics panels.',
]

const controls = [
  { term: 'Indentation', detail: '2, 4, 8 spaces, or a real tab character.' },
  { term: 'Sort keys', detail: 'Recursively orders object keys alphabetically without changing values.' },
  { term: 'Pretty nested', detail: 'Keeps nested containers expanded or renders them inline.' },
  { term: 'Array layout', detail: 'Expand every array across lines, or compact primitive arrays.' },
  {
    term: 'Compare',
    detail: 'Drop two documents side by side to get a semantic diff of every addition, removal, and change.',
  },
  {
    term: 'CSV ↔ JSON',
    detail: 'Convert CSV rows to JSON objects or flatten JSON into CSV with delimiter and header controls.',
  },
  {
    term: 'Schema examples',
    detail: 'Generate sample documents from a JSON Schema or an existing JSON sample, including constraints, enums, formats, and local refs.',
  },
]

const shortcuts = [
  { keys: ['Ctrl / ⌘', 'Enter'], action: 'Validate JSON' },
  { keys: ['Ctrl / ⌘', 'Shift', 'M'], action: 'Switch to minified output' },
  { keys: ['Esc'], action: 'Close dialogs and menus' },
]

export function Documentation() {
  return (
    <section id="docs" className="scroll-mt-24">
      <div className="mb-5">
        <span className="section-label">Documentation</span>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[1.7rem]">
          Built for everyday JSON work
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          A quick tour of the workspace, the formatting controls, and the privacy model behind it.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="card p-5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <Wand2 className="size-4.5" />
          </span>
          <h3 className="mt-3.5 text-sm font-semibold text-slate-900 dark:text-white">
            Format in three steps
          </h3>
          <ol className="mt-3 space-y-2.5">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-2.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-600 dark:bg-white/[0.08] dark:text-slate-300">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </article>

        <article className="card p-5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
            <Sparkles className="size-4.5" />
          </span>
          <h3 className="mt-3.5 text-sm font-semibold text-slate-900 dark:text-white">
            Workspace controls
          </h3>
          <dl className="mt-3 space-y-2.5">
            {controls.map((item) => (
              <div key={item.term} className="text-xs leading-5">
                <dt className="font-medium text-slate-700 dark:text-slate-200">{item.term}</dt>
                <dd className="text-slate-500 dark:text-slate-400">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article
          id="about"
          className="card scroll-mt-24 p-5"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <ShieldCheck className="size-4.5" />
          </span>
          <h3 className="mt-3.5 text-sm font-semibold text-slate-900 dark:text-white">
            Privacy by design
          </h3>
          <ul className="mt-3 space-y-2.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            <li className="flex gap-2">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
              Your JSON is parsed and formatted entirely in this browser tab.
            </li>
            <li className="flex gap-2">
              <Cpu className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
              Parsing runs in a Web Worker so large documents never freeze the interface.
            </li>
            <li className="flex gap-2">
              <BookOpen className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
              No uploads, no analytics on JSON content, and no JSON stored in localStorage.
            </li>
          </ul>
        </article>
      </div>

      <div className="card mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <Keyboard className="size-4 text-slate-400" />
          Keyboard shortcuts
        </span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {shortcuts.map((shortcut) => (
            <span key={shortcut.action} className="inline-flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
              {shortcut.action}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
