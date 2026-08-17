# Cloud Functions (optional, not currently deployed)

This directory holds optional Cloud Functions — a generic "add gift from any link" metadata
fetcher and a best-effort Amazon wishlist bulk importer — that were built but are **not part of
the app's current deploy**, and the frontend does not call them.

Why: both require the paid **Blaze** plan (Cloud Functions and Cloud Storage both require it —
Firebase's free Spark plan doesn't support either). This project is deployed on Spark, so these
are left here only in case that ever changes.

If you upgrade to Blaze and want them back:

1. `firebase deploy --only functions` (add a `"functions"` block back to `firebase.json` pointing
   at this directory — see git history / the project's README for the original config).
2. Re-add `web/src/lib/importFunctions.ts`, the "From a link" tab in `ItemFormModal.tsx`, and an
   "Import from Amazon" entry point in `ListEditorPage.tsx` (also removed when this went Spark-only).
