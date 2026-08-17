import { Link } from 'react-router-dom'
import { ListChecks, CalendarClock, Users, Sparkles, Repeat, QrCode, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { SquidLogo } from '../components/ui/SquidLogo'

const features = [
  {
    icon: ListChecks,
    title: 'Organize with sections',
    description: 'Group gifts however you like — "Clothes", "Big ticket", "Stocking stuffers" — and rearrange anytime.',
  },
  {
    icon: CalendarClock,
    title: 'Built for every occasion',
    description: 'Christmas, birthdays, weddings, and more — each with its own date, countdown, and priority levels per gift.',
  },
  {
    icon: EyeOff,
    title: 'Surprises stay secret',
    description: "You never see who claimed what on your own list — only your guests can, so nobody double-buys.",
  },
  {
    icon: Users,
    title: 'No account needed to claim',
    description: 'Share a link or QR code. Anyone can check items off your list in seconds.',
  },
  {
    icon: Repeat,
    title: 'Reuse it every year',
    description: 'Duplicate last year\'s Christmas list as a starting point for this year in one click.',
  },
  {
    icon: QrCode,
    title: 'Share your way',
    description: 'Share via link, QR code, or invite — updates sync live for everyone viewing.',
  },
]

export function LandingPage() {
  const { user, isAnonymous } = useAuth()
  const loggedIn = user && !isAnonymous

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white dark:from-brand-950/40 dark:via-slate-900 dark:to-slate-900" />
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center sm:py-28">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> Gift lists that keep the surprise
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
            The gift list your whole family will actually use
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Build a wish list for Christmas, birthdays, or any occasion. Share a link, and let people check items off — no
            duplicate gifts, no spoiled surprises.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={loggedIn ? '/dashboard' : '/signup'}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-700"
            >
              {loggedIn ? 'Go to your lists' : 'Create your first list'} <ArrowRight className="h-4 w-4" />
            </Link>
            {!loggedIn && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
          <SquidLogo size={32} className="mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Ready to build your list?</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">It takes less than a minute, and it's free to get started.</p>
          <Link
            to={loggedIn ? '/dashboard' : '/signup'}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-brand-700"
          >
            {loggedIn ? 'Go to your lists' : 'Get started free'} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
