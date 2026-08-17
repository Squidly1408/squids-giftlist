import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Keeps GiftItem.quantityClaimed / isFullyClaimed in sync with its claims subcollection.
 * This runs with admin privileges so it can read claim documents the list owner's own
 * security-rule access is deliberately blocked from (see firestore.rules) — the owner
 * only ever sees the aggregate count, never who claimed what.
 */
export const onClaimWritten = onDocumentWritten('lists/{listId}/items/{itemId}/claims/{claimId}', async (event) => {
  const { listId, itemId } = event.params
  const db = getFirestore()

  const claimsSnap = await db.collection('lists').doc(listId).collection('items').doc(itemId).collection('claims').get()

  let quantityClaimed = 0
  claimsSnap.forEach((doc) => {
    const qty = doc.data().quantity
    if (typeof qty === 'number' && qty > 0) quantityClaimed += qty
  })

  const itemRef = db.collection('lists').doc(listId).collection('items').doc(itemId)
  const itemSnap = await itemRef.get()
  if (!itemSnap.exists) return

  const quantityDesired = itemSnap.data()?.quantityDesired ?? 1
  await itemRef.update({
    quantityClaimed,
    isFullyClaimed: quantityClaimed >= quantityDesired,
  })
})
