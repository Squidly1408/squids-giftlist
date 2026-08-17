import { useMemo } from 'react'
import type { GiftItem, ListSection } from '../types'

export interface ItemGroup {
  section: ListSection | null
  items: GiftItem[]
}

/** Groups items by section (in section order), with a trailing "no section" group when needed. */
export function useGroupedItems(sections: ListSection[], items: GiftItem[]): ItemGroup[] {
  return useMemo(() => {
    const bySection = new Map<string, GiftItem[]>()
    const uncategorized: GiftItem[] = []
    for (const item of items) {
      if (item.sectionId) {
        const list = bySection.get(item.sectionId) ?? []
        list.push(item)
        bySection.set(item.sectionId, list)
      } else {
        uncategorized.push(item)
      }
    }
    const groups: ItemGroup[] = sections.map((section) => ({
      section,
      items: (bySection.get(section.id) ?? []).sort((a, b) => a.order - b.order),
    }))
    if (uncategorized.length > 0) {
      groups.push({ section: null, items: uncategorized.sort((a, b) => a.order - b.order) })
    }
    return groups
  }, [sections, items])
}
