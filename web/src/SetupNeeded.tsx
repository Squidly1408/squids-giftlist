import { Terminal } from 'lucide-react'
import { SquidLogo } from './components/ui/SquidLogo'

/**
 * Shown instead of the app when no Firebase config is present, so a fresh checkout shows
 * clear next steps instead of a blank white screen. See web/.env.example and the root README.
 */
export function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <SquidLogo size={20} />
        </span>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Connect your Firebase project</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Squids-GiftList needs a Firebase project to run. Create <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-900">web/.env.local</code> with your
          project's config, then restart the dev server.
        </p>

        <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-900 p-4 text-xs text-slate-100 dark:bg-slate-950">
          <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <pre className="whitespace-pre-wrap font-mono">{`cp web/.env.example web/.env.local\n# then fill in the values from:\n# Firebase Console -> Project settings -> Your apps`}</pre>
        </div>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Full setup steps (creating the project, enabling Auth/Firestore, deploying) are in the project's{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-900">README.md</code>.
        </p>
      </div>
    </div>
  )
}
