import {
  ArrowRight,
  BookOpen,
  Cpu,
  GitBranch,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'

const features = [
  { icon: Zap, label: 'Instant validation' },
  { icon: Cpu, label: 'Web Worker powered' },
  { icon: GitBranch, label: 'Tree explorer' },
  { icon: LockKeyhole, label: 'Zero uploads' },
]

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-[-22rem] h-[38rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.22),rgba(56,189,248,0.10)_45%,transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.26),rgba(56,189,248,0.10)_45%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700 shadow-sm backdrop-blur dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
              <Sparkles className="size-3.5" />
              Developer-grade JSON workspace
            </span>
          </div>

          <h1 className="animate-fade-up animation-delay-1 mt-6 text-balance text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.035em] text-slate-900 dark:text-white sm:text-6xl lg:text-[4.25rem]">
            JSON Formatter{' '}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-indigo-400 dark:to-sky-400">
              Pro
            </span>
          </h1>

          <p className="animate-fade-up animation-delay-1 mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg sm:leading-8">
            Format, validate, beautify, and minify JSON instantly — with a polished code
            editor, live statistics, and an interactive tree explorer.
          </p>

          <div className="animate-fade-up animation-delay-2 mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#workspace" className="btn-primary w-full px-5 py-2.5 text-sm sm:w-auto">
              Open the workspace
              <ArrowRight className="size-4" />
            </a>
            <a href="#docs" className="btn-secondary w-full px-5 py-2.5 text-sm sm:w-auto">
              <BookOpen className="size-4" />
              Read the docs
            </a>
          </div>

          <div className="animate-fade-up animation-delay-2 mt-7 flex justify-center">
            <span className="inline-flex max-w-full items-start gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-1.5 text-left text-[11px] font-medium text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300 sm:items-center sm:rounded-full sm:text-xs">
              <ShieldCheck className="mt-px size-3.5 shrink-0 sm:mt-0" />
              <span>100% Client-Side Processing – Your JSON Never Leaves Your Browser.</span>
            </span>
          </div>

          <div className="animate-fade-up animation-delay-2 mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
            {features.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1 text-[11px] font-medium text-slate-500 backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400"
              >
                <Icon className="size-3.5 text-violet-500 dark:text-violet-400" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
