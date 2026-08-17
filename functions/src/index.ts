import { initializeApp } from 'firebase-admin/app'
import { setGlobalOptions } from 'firebase-functions/v2'

// Passing projectId explicitly (rather than calling initializeApp() with no args) avoids the
// Admin SDK falling back to Application Default Credentials discovery, which tries to reach the
// real GCP metadata server — that hangs for ~10s and times out the CLI's local function-loading
// step, especially under the emulator or offline. GCLOUD_PROJECT is set automatically by both
// the emulator and real Cloud Functions.
initializeApp({ projectId: process.env.GCLOUD_PROJECT })
setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

export { linkPreview } from './linkPreview'
export { importAmazonWishlist } from './importAmazon'
export { onClaimWritten } from './claimsRollup'
