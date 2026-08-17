import type { Timestamp } from 'firebase/firestore'

/** Occasion presets used for icon/color theming of a list. 'custom' allows any user-typed label. */
export type Occasion =
  | 'christmas'
  | 'birthday'
  | 'wedding'
  | 'babyShower'
  | 'graduation'
  | 'anniversary'
  | 'holiday'
  | 'housewarming'
  | 'custom'

export type Visibility = 'private' | 'unlisted'

export type Priority = 'low' | 'medium' | 'high'

export type ItemSource = 'manual' | 'link' | 'amazon'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL?: string | null
  createdAt: Timestamp
}

export interface GiftList {
  id: string
  ownerId: string
  ownerDisplayName?: string
  title: string
  occasion: Occasion
  customOccasionLabel?: string
  description?: string
  eventDate?: Timestamp | null
  coverImageUrl?: string | null
  shareSlug: string
  visibility: Visibility
  archived: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ListSection {
  id: string
  title: string
  order: number
  createdAt: Timestamp
}

export interface GiftItem {
  id: string
  sectionId: string | null
  name: string
  description?: string
  url?: string | null
  imageUrl?: string | null
  price?: number | null
  currency?: string | null
  priority: Priority
  quantityDesired: number
  quantityClaimed: number
  isFullyClaimed: boolean
  source: ItemSource
  order: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** Lives in a subcollection so security rules can hide claimant identity from the list owner. */
export interface Claim {
  id: string
  claimerName: string
  claimerUid?: string | null
  quantity: number
  note?: string
  createdAt: Timestamp
}

export const OCCASION_META: Record<Occasion, { label: string; emoji: string; color: string }> = {
  christmas: { label: 'Christmas', emoji: '🎄', color: '#dc2626' },
  birthday: { label: 'Birthday', emoji: '🎂', color: '#db2777' },
  wedding: { label: 'Wedding', emoji: '💍', color: '#7c3aed' },
  babyShower: { label: 'Baby Shower', emoji: '🍼', color: '#0891b2' },
  graduation: { label: 'Graduation', emoji: '🎓', color: '#2563eb' },
  anniversary: { label: 'Anniversary', emoji: '💐', color: '#c026d3' },
  holiday: { label: 'Holiday', emoji: '🎁', color: '#059669' },
  housewarming: { label: 'Housewarming', emoji: '🏡', color: '#d97706' },
  custom: { label: 'Custom', emoji: '✨', color: '#6366f1' },
}

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: 'Really want', color: '#dc2626' },
  medium: { label: 'Would like', color: '#d97706' },
  low: { label: 'If possible', color: '#64748b' },
}
