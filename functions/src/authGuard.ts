import type { CallableRequest } from 'firebase-functions/v2/https'
import { HttpsError } from 'firebase-functions/v2/https'

/**
 * linkPreview and importAmazonWishlist both make real outbound network requests on the Blaze
 * plan, i.e. they cost money and can be abused as an open URL-fetching proxy if left callable by
 * anyone. Only signed-in, non-anonymous accounts (the only ones that can own a list) may call
 * them — matches the restriction already placed on list creation in firestore.rules.
 */
export function requireRealAccount(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to use this feature.')
  }
  if (request.auth.token.firebase?.sign_in_provider === 'anonymous') {
    throw new HttpsError('permission-denied', 'Create an account to use this feature.')
  }
}
