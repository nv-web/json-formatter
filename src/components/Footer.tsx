import { ArrowUp, Braces, ShieldCheck } from 'lucide-react'
import { GithubIcon } from './ui/GithubIcon'

interface FooterProps {
  onOpenPrivacy: () => void
}

const currentYear = new Date().getFullYear()

export function Footer({ onOpenPrivacy }: FooterProps) {
  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white/50 dark:border-white/10 dark:bg-white/[0.015]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <a href="#top" className="inline-flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-500 to-sky-500 text-white shadow-lg shadow-violet-500/20">
                <Braces className="size-[18px]" strokeWidth={2.4} />
              </span>
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                JSON
                <span className="text-violet-600 dark:text-violet-400">ify</span>
              </span>
            </a>
            <p className="mt-3 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
              A fast, private, developer-first JSON workspace. Format, validate, beautify, and
              minify without sending a single byte to a server.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
              <ShieldCheck className="size-3.5" />
              100% Client-Side Processing – Your JSON Never Leaves Your Browser.
            </span>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Product
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a href="#workspace" className="text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400">
                  Formatter
                </a>
              </li>
              <li>
                <a href="#input-panel" className="text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400">
                  Validator
                </a>
              </li>
              <li>
                <a href="#stats" className="text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400">
                  Statistics
                </a>
              </li>
              <li>
                <a href="#tree" className="text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400">
                  Tree viewer
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Resources
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a href="#docs" className="text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#about" className="text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400">
                  About
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400"
                >
                  Privacy policy
                </button>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400"
                >
                  <GithubIcon className="size-3.5" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-slate-200/80 pt-5 text-[11px] text-slate-400 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} JSONify. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Client-side by design.</span>
            <a
              href="#top"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
            >
              Back to top
              <ArrowUp className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
