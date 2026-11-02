import { useEffect, useState } from 'react'
import { Braces, Menu, Moon, Sun, X } from 'lucide-react'
import { cx } from '../lib/cx'
import type { Theme } from '../types/ui'

const links = [
  { href: '#workspace', label: 'Formatter' },
  { href: '#input-panel', label: 'Validator' },
  { href: '#docs', label: 'Documentation' },
]

interface HeaderProps {
  theme: Theme
  onToggleTheme: () => void
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#070a10]/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-7">
          <a href="#top" className="group flex shrink-0 items-center gap-2.5" aria-label="JSONify home">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-500 to-sky-500 text-white shadow-lg shadow-violet-500/25 transition-transform duration-200 group-hover:scale-105">
              <Braces className="size-[18px]" strokeWidth={2.4} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
                JSON
                <span className="bg-gradient-to-r from-violet-600 to-sky-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-sky-400">
                  ify
                </span>
              </span>
              <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:block">
                Client-side JSON toolkit
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="relative inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <Sun
              className={cx(
                'absolute size-[17px] transition-all duration-300',
                theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0',
              )}
            />
            <Moon
              className={cx(
                'absolute size-[17px] transition-all duration-300',
                theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100',
              )}
            />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] md:hidden"
          >
            {menuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-navigation"
          className="animate-fade-up border-t border-slate-200/70 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#070a10] md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#stats"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]"
            >
              Statistics
            </a>
            <a
              href="#tree"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]"
            >
              Tree viewer
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
