import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import { nanoid } from 'nanoid'
import type { Claim, GiftItem, GiftList, ListSection, Occasion, Priority, UserProfile, Visibility } from '../types'

// ---------- users ----------

export async function ensureUserProfile(uid: string, data: Omit<UserProfile, 'uid' | 'createdAt'>) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { ...data, createdAt: serverTimestamp() })
  }
  return ref
}

export async function updateUserProfile(uid: string, patch: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>) {
  await updateDoc(doc(db, 'users', uid), patch)
}

// ---------- lists ----------

// A function rather than a module-level constant: `db` is null until Firebase is configured
// (see lib/firebase.ts), so this must only be evaluated once a caller actually needs it.
function listsCol() {
  return collection(db, 'lists')
}

export interface NewListInput {
  title: string
  occasion: Occasion
  customOccasionLabel?: string
  description?: string
  eventDate?: Date | null
  visibility?: Visibility
}

export async function createList(ownerId: string, ownerDisplayName: string, input: NewListInput) {
  // The document ID itself is the share token (rather than a separate field queried later): a
  // guest opening a share link then only ever needs a direct get-by-ID, never a collection query
  // filtered on a non-indexed-for-rules field, which security rules can't evaluate for anonymous
  // readers as reliably. See PublicListPage / subscribeToList.
  const ref = doc(listsCol(), nanoid(10))
  await setDoc(ref, {
    ownerId,
    ownerDisplayName,
    title: input.title.trim(),
    occasion: input.occasion,
    customOccasionLabel: input.customOccasionLabel ?? null,
    description: input.description?.trim() ?? '',
    eventDate: input.eventDate ?? null,
    coverImageUrl: null,
    shareSlug: ref.id,
    visibility: input.visibility ?? 'unlisted',
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateList(listId: string, patch: Record<string, unknown>) {
  await updateDoc(doc(db, 'lists', listId), { ...patch, updatedAt: serverTimestamp() })
}

export async function setListArchived(listId: string, archived: boolean) {
  await updateList(listId, { archived })
}

export async function deleteList(listId: string) {
  // Cascade delete sections, items, and each item's claims. Small lists, so sequential batches are fine.
  const itemsSnap = await getDocs(collection(db, 'lists', listId, 'items'))
  for (const itemDoc of itemsSnap.docs) {
    const claimsSnap = await getDocs(collection(db, 'lists', listId, 'items', itemDoc.id, 'claims'))
    const batch = writeBatch(db)
    claimsSnap.docs.forEach((c) => batch.delete(c.ref))
    batch.delete(itemDoc.ref)
    await batch.commit()
  }
  const sectionsSnap = await getDocs(collection(db, 'lists', listId, 'sections'))
  const sectionBatch = writeBatch(db)
  sectionsSnap.docs.forEach((s) => sectionBatch.delete(s.ref))
  await sectionBatch.commit()
  await deleteDoc(doc(db, 'lists', listId))
}

/** Copies a list's sections and items (not claims) into a brand-new list. Great for "do this again next year". */
export async function duplicateList(listId: string, overrides: Partial<NewListInput> & { ownerId: string; ownerDisplayName: string }) {
  const listSnap = await getDoc(doc(db, 'lists', listId))
  if (!listSnap.exists()) throw new Error('List not found')
  const original = listSnap.data() as GiftList

  const newListId = await createList(overrides.ownerId, overrides.ownerDisplayName, {
    title: overrides.title ?? `${original.title} (copy)`,
    occasion: overrides.occasion ?? original.occasion,
    customOccasionLabel: overrides.customOccasionLabel ?? original.customOccasionLabel,
    description: overrides.description ?? original.description,
    eventDate: overrides.eventDate ?? null,
    visibility: overrides.visibility ?? original.visibility,
  })

  const sectionsSnap = await getDocs(query(collection(db, 'lists', listId, 'sections'), orderBy('order')))
  const sectionIdMap = new Map<string, string>()
  const batch = writeBatch(db)
  sectionsSnap.docs.forEach((s) => {
    const newSectionRef = doc(collection(db, 'lists', newListId, 'sections'))
    sectionIdMap.set(s.id, newSectionRef.id)
    batch.set(newSectionRef, { ...s.data(), createdAt: serverTimestamp() })
  })
  await batch.commit()

  const itemsSnap = await getDocs(collection(db, 'lists', listId, 'items'))
  const itemBatch = writeBatch(db)
  itemsSnap.docs.forEach((i) => {
    const data = i.data() as GiftItem
    const newItemRef = doc(collection(db, 'lists', newListId, 'items'))
    itemBatch.set(newItemRef, {
      ...data,
      sectionId: data.sectionId ? sectionIdMap.get(data.sectionId) ?? null : null,
      quantityClaimed: 0,
      isFullyClaimed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  await itemBatch.commit()

  return newListId
}

export function subscribeToUserLists(uid: string, cb: (lists: GiftList[]) => void): Unsubscribe {
  const q = query(listsCol(), where('ownerId', '==', uid), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GiftList)))
}

export function subscribeToList(listId: string, cb: (list: GiftList | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'lists', listId), (snap) => cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as GiftList) : null))
}

// A share slug IS a list's document ID (see createList), so looking one up is just a get-by-ID —
// these two aliases exist so callers reading a share link don't need to know that detail.
export async function getListByShareSlug(shareSlug: string): Promise<GiftList | null> {
  const snap = await getDoc(doc(db, 'lists', shareSlug))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as GiftList) : null
}

export const subscribeToListByShareSlug = subscribeToList

// ---------- sections ----------

export function subscribeToSections(listId: string, cb: (sections: ListSection[]) => void): Unsubscribe {
  const q = query(collection(db, 'lists', listId, 'sections'), orderBy('order'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ListSection)))
}

export async function createSection(listId: string, title: string, order: number) {
  const ref = await addDoc(collection(db, 'lists', listId, 'sections'), {
    title: title.trim(),
    order,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function renameSection(listId: string, sectionId: string, title: string) {
  await updateDoc(doc(db, 'lists', listId, 'sections', sectionId), { title: title.trim() })
}

export async function reorderSections(listId: string, orderedIds: string[]) {
  const batch = writeBatch(db)
  orderedIds.forEach((id, index) => batch.update(doc(db, 'lists', listId, 'sections', id), { order: index }))
  await batch.commit()
}

export async function deleteSection(listId: string, sectionId: string) {
  // Items in this section become "uncategorized" rather than being deleted.
  const itemsSnap = await getDocs(query(collection(db, 'lists', listId, 'items'), where('sectionId', '==', sectionId)))
  const batch = writeBatch(db)
  itemsSnap.docs.forEach((i) => batch.update(i.ref, { sectionId: null }))
  batch.delete(doc(db, 'lists', listId, 'sections', sectionId))
  await batch.commit()
}

// ---------- items ----------

export function subscribeToItems(listId: string, cb: (items: GiftItem[]) => void): Unsubscribe {
  const q = query(collection(db, 'lists', listId, 'items'), orderBy('order'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GiftItem)))
}

export interface NewItemInput {
  sectionId: string | null
  name: string
  description?: string
  url?: string | null
  imageUrl?: string | null
  price?: number | null
  currency?: string | null
  priority?: Priority
  quantityDesired?: number
  source?: GiftItem['source']
  order: number
}

export async function createItem(listId: string, input: NewItemInput) {
  const ref = await addDoc(collection(db, 'lists', listId, 'items'), {
    sectionId: input.sectionId,
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    url: input.url ?? null,
    imageUrl: input.imageUrl ?? null,
    price: input.price ?? null,
    currency: input.currency ?? 'USD',
    priority: input.priority ?? 'medium',
    quantityDesired: input.quantityDesired ?? 1,
    quantityClaimed: 0,
    isFullyClaimed: false,
    source: input.source ?? 'manual',
    order: input.order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function createItemsBulk(listId: string, items: NewItemInput[]) {
  const batch = writeBatch(db)
  items.forEach((input) => {
    const ref = doc(collection(db, 'lists', listId, 'items'))
    batch.set(ref, {
      sectionId: input.sectionId,
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      url: input.url ?? null,
      imageUrl: input.imageUrl ?? null,
      price: input.price ?? null,
      currency: input.currency ?? 'USD',
      priority: input.priority ?? 'medium',
      quantityDesired: input.quantityDesired ?? 1,
      quantityClaimed: 0,
      isFullyClaimed: false,
      source: input.source ?? 'manual',
      order: input.order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  await batch.commit()
}

export async function updateItem(listId: string, itemId: string, patch: Record<string, unknown>) {
  await updateDoc(doc(db, 'lists', listId, 'items', itemId), { ...patch, updatedAt: serverTimestamp() })
}

export async function deleteItem(listId: string, itemId: string) {
  await deleteDoc(doc(db, 'lists', listId, 'items', itemId))
}

export async function reorderItems(listId: string, itemUpdates: { id: string; order: number; sectionId: string | null }[]) {
  const batch = writeBatch(db)
  itemUpdates.forEach(({ id, order, sectionId }) =>
    batch.update(doc(db, 'lists', listId, 'items', id), { order, sectionId, updatedAt: serverTimestamp() })
  )
  await batch.commit()
}

// ---------- claims ----------
// Claims live in a subcollection so Firestore security rules can let other guests read them
// (to avoid duplicate gifts) while blocking the list owner from ever reading them (keeps the
// surprise). This app targets the free Spark plan (no Cloud Functions), so there's no trusted
// server to keep a redacted aggregate in sync — instead, addClaim/removeClaim update the item's
// quantityClaimed themselves, in the same atomic transaction as the claim doc write. Firestore
// rules constrain a non-owner's item update to ONLY those aggregate fields (never name, price,
// etc.), so this can't be used to tamper with the gift itself — the one tradeoff is that the
// count is only as trustworthy as the claimer's browser, same as any client-computed counter.

export function subscribeToClaims(listId: string, itemId: string, cb: (claims: Claim[]) => void): Unsubscribe {
  const q = query(collection(db, 'lists', listId, 'items', itemId, 'claims'), orderBy('createdAt'))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Claim)),
    () => cb([]) // owner will get permission-denied here by design; treat as "no visible claims"
  )
}

export async function addClaim(
  listId: string,
  itemId: string,
  claim: { claimerUid: string; claimerName: string; quantity: number; note?: string }
) {
  const itemRef = doc(db, 'lists', listId, 'items', itemId)
  const claimRef = doc(collection(db, 'lists', listId, 'items', itemId, 'claims'))
  await runTransaction(db, async (tx) => {
    const itemSnap = await tx.get(itemRef)
    if (!itemSnap.exists()) throw new Error('This gift no longer exists.')
    const item = itemSnap.data() as GiftItem
    const quantityClaimed = (item.quantityClaimed ?? 0) + claim.quantity

    tx.set(claimRef, {
      claimerUid: claim.claimerUid,
      claimerName: claim.claimerName.trim(),
      quantity: claim.quantity,
      note: claim.note?.trim() ?? '',
      createdAt: serverTimestamp(),
    })
    tx.update(itemRef, {
      quantityClaimed,
      isFullyClaimed: quantityClaimed >= item.quantityDesired,
      updatedAt: serverTimestamp(),
    })
  })
}

export async function removeClaim(listId: string, itemId: string, claimId: string) {
  const itemRef = doc(db, 'lists', listId, 'items', itemId)
  const claimRef = doc(db, 'lists', listId, 'items', itemId, 'claims', claimId)
  await runTransaction(db, async (tx) => {
    const [itemSnap, claimSnap] = await Promise.all([tx.get(itemRef), tx.get(claimRef)])
    if (!itemSnap.exists() || !claimSnap.exists()) return
    const item = itemSnap.data() as GiftItem
    const claim = claimSnap.data() as Claim
    const quantityClaimed = Math.max(0, (item.quantityClaimed ?? 0) - claim.quantity)

    tx.delete(claimRef)
    tx.update(itemRef, {
      quantityClaimed,
      isFullyClaimed: quantityClaimed >= item.quantityDesired,
      updatedAt: serverTimestamp(),
    })
  })
}
