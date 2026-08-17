import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  MoreVertical,
  Pencil,
  Plus,
  Share2,
  ShoppingCart,
  Trash2,
  Archive,
  ArchiveRestore,
  CalendarDays,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import {
  createItem,
  createSection,
  deleteItem,
  deleteList,
  deleteSection,
  duplicateList,
  renameSection,
  reorderSections,
  setListArchived,
  subscribeToItems,
  subscribeToList,
  subscribeToSections,
  updateItem,
  updateList,
} from '../lib/firestore'
import type { GiftItem, GiftList, ListSection } from '../types'
import { OCCASION_META } from '../types'
import { useGroupedItems } from '../hooks/useGroupedItems'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ItemCard } from '../components/ItemCard'
import { ItemFormModal, type ItemFormValues } from '../components/ItemFormModal'
import { ListFormModal, type ListFormValues } from '../components/ListFormModal'
import { ShareModal } from '../components/ShareModal'
import { formatCountdown } from '../utils/format'

export function ListEditorPage() {
  const { listId } = useParams<{ listId: string }>()
  const { user } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [list, setList] = useState<GiftList | null | undefined>(undefined)
  const [sections, setSections] = useState<ListSection[]>([])
  const [items, setItems] = useState<GiftItem[]>([])

  const [editListOpen, setEditListOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [itemModal, setItemModal] = useState<{ open: boolean; item?: GiftItem | null; sectionId?: string | null }>({ open: false })
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [addingSection, setAddingSection] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'list' | 'item' | 'section'; id: string; name: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!listId) return
    const unsub1 = subscribeToList(listId, setList)
    const unsub2 = subscribeToSections(listId, setSections)
    const unsub3 = subscribeToItems(listId, setItems)
    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [listId])

  const groups = useGroupedItems(sections, items)

  if (list === undefined) return <Spinner full />
  if (list === null) {
    return (
      <EmptyState
        title="List not found"
        description="This list may have been deleted."
        action={
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Button>
        }
      />
    )
  }
  if (!user || list.ownerId !== user.uid) {
    return (
      <EmptyState
        title="Not authorized"
        description="You don't have permission to edit this list."
        action={
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Button>
        }
      />
    )
  }

  // Re-bind as a non-nullable const: closures below can't rely on the narrowing from the
  // guard clauses above (TS doesn't propagate CFA narrowing of `list` into nested functions).
  const currentList = list
  const meta = OCCASION_META[currentList.occasion]
  const eventDate = currentList.eventDate?.toDate?.() ?? null
  const countdown = formatCountdown(eventDate)

  async function handleAddSection() {
    if (!listId || !newSectionTitle.trim()) return
    await createSection(listId, newSectionTitle, sections.length)
    setNewSectionTitle('')
    setAddingSection(false)
  }

  async function handleMoveSection(index: number, direction: -1 | 1) {
    if (!listId) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sections.length) return
    const reordered = [...sections]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)
    await reorderSections(
      listId,
      reordered.map((s) => s.id)
    )
  }

  async function handleRenameSection(section: ListSection) {
    const title = window.prompt('Rename section', section.title)
    if (title && listId) await renameSection(listId, section.id, title)
  }

  async function handleItemSubmit(values: ItemFormValues) {
    if (!listId) return
    if (itemModal.item) {
      await updateItem(listId, itemModal.item.id, { ...values })
      notify('Gift updated')
    } else {
      const sectionItems = items.filter((i) => i.sectionId === values.sectionId)
      await createItem(listId, { ...values, order: sectionItems.length })
      notify('Gift added')
    }
  }

  async function handleEditList(values: ListFormValues) {
    if (!listId) return
    await updateList(listId, {
      title: values.title,
      occasion: values.occasion,
      customOccasionLabel: values.customOccasionLabel,
      description: values.description,
      eventDate: values.eventDate ? new Date(values.eventDate) : null,
      visibility: values.visibility,
    })
    notify('List updated')
  }

  async function handleDuplicate() {
    if (!listId || !user) return
    const newId = await duplicateList(listId, { ownerId: user.uid, ownerDisplayName: user.displayName ?? 'Someone', title: `${currentList.title} (copy)` })
    notify('List duplicated')
    navigate(`/lists/${newId}`)
  }

  async function handleToggleArchive() {
    if (!listId) return
    await setListArchived(listId, !currentList.archived)
    notify(currentList.archived ? 'List restored' : 'List archived')
  }

  async function confirmDelete() {
    if (!listId || !deleteTarget) return
    if (deleteTarget.type === 'list') {
      await deleteList(listId)
      notify('List deleted')
      navigate('/dashboard')
    } else if (deleteTarget.type === 'section') {
      await deleteSection(listId, deleteTarget.id)
      notify('Section removed')
    } else {
      await deleteItem(listId, deleteTarget.id)
      notify('Gift removed')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeft className="h-3.5 w-3.5" /> All lists
      </Link>

      <div
        className="mb-6 flex flex-col gap-4 rounded-2xl p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between"
        style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}bb)` }}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl">{meta.emoji}</span>
            <h1 className="truncate text-xl font-semibold sm:text-2xl">{list.title}</h1>
            {list.archived && <Badge tone="neutral">Archived</Badge>}
          </div>
          {list.description && <p className="mt-1 max-w-xl text-sm text-white/85">{list.description}</p>}
          {countdown && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/90">
              <CalendarDays className="h-3.5 w-3.5" /> {countdown}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={() => setShareOpen(true)} className="bg-white/95 text-slate-900 hover:bg-white">
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg bg-white/15 p-2.5 text-white hover:bg-white/25"
              aria-label="List options"
            >
              <MoreVertical className="h-4.5 w-4.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1.5 text-left shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <MenuItem icon={Pencil} label="Edit details" onClick={() => (setMenuOpen(false), setEditListOpen(true))} />
                  <MenuItem icon={Copy} label="Duplicate list" onClick={() => (setMenuOpen(false), handleDuplicate())} />
                  <MenuItem
                    icon={list.archived ? ArchiveRestore : Archive}
                    label={list.archived ? 'Restore' : 'Archive'}
                    onClick={() => (setMenuOpen(false), handleToggleArchive())}
                  />
                  <MenuItem
                    icon={Trash2}
                    label="Delete list"
                    danger
                    onClick={() => (setMenuOpen(false), setDeleteTarget({ type: 'list', id: list.id, name: list.title }))}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={() => setItemModal({ open: true, sectionId: sections[0]?.id ?? null })}>
          <Plus className="h-4 w-4" /> Add a gift
        </Button>
        {!addingSection && (
          <Button variant="ghost" onClick={() => setAddingSection(true)}>
            <Plus className="h-4 w-4" /> Add section
          </Button>
        )}
      </div>

      {addingSection && (
        <div className="mb-6 flex items-center gap-2">
          <input
            autoFocus
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
            placeholder="Section name, e.g. Stocking stuffers"
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
          <Button size="sm" onClick={handleAddSection}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingSection(false)}>
            Cancel
          </Button>
        </div>
      )}

      {items.length === 0 && sections.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-10 w-10" />}
          title="This list is empty"
          description="Add your first gift to get started."
          action={
            <Button onClick={() => setItemModal({ open: true, sectionId: null })}>
              <Plus className="h-4 w-4" /> Add your first gift
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group, index) => (
            <div key={group.section?.id ?? 'none'}>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {group.section?.title ?? 'Uncategorized'}
                </h2>
                {group.section && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleMoveSection(index, -1)} disabled={index === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(index, 1)}
                      disabled={index === sections.length - 1}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleRenameSection(group.section!)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'section', id: group.section!.id, name: group.section!.title })}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setItemModal({ open: true, sectionId: group.section!.id })}
                      className="ml-1 rounded p-1 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {group.items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
                  No gifts here yet
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onEdit={() => setItemModal({ open: true, item })}
                      onDelete={() => setDeleteTarget({ type: 'item', id: item.id, name: item.name })}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ItemFormModal
        open={itemModal.open}
        onClose={() => setItemModal({ open: false })}
        onSubmit={handleItemSubmit}
        sections={sections}
        initial={itemModal.item}
        defaultSectionId={itemModal.sectionId}
      />
      <ListFormModal open={editListOpen} onClose={() => setEditListOpen(false)} onSubmit={handleEditList} initial={list} submitLabel="Save changes" />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} shareSlug={list.shareSlug} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget?.type ?? 'item'}?`}
        description={`"${deleteTarget?.name}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={
        danger
          ? 'flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20'
          : 'flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50'
      }
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  )
}
