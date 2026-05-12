import { useState, useRef } from 'react'
import type { PlyCell, ThreadCategory } from '../../types'
import styles from './PlyCell.module.css'

interface Props {
  cell: PlyCell
  threads: ThreadCategory[]
  onUpdate: (data: { title: string; body: string; tags: string[]; categoryId?: string }) => void
  onDelete: () => void
}

export function PlyCellComponent({ cell, threads, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState(cell.title)
  const [body, setBody] = useState(cell.body)
  const [categoryId, setCategoryId] = useState(cell.category_id || '')
  const [tags, setTags] = useState<string[]>(JSON.parse(cell.tags || '[]'))
  const [tagInput, setTagInput] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const thread = threads.find((t) => t.id === categoryId)

  const save = (overrides?: any) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onUpdate({ title: overrides?.title ?? title, body: overrides?.body ?? body, tags: overrides?.tags ?? tags, categoryId: (overrides?.categoryId ?? categoryId) || undefined })
    }, 600)
  }

  const addTag = () => {
    if (!tagInput.trim()) return
    const newTags = [...tags, tagInput.trim()]
    setTags(newTags); setTagInput(''); save({ tags: newTags })
  }

  return (
    <div className={styles.cell} style={{ borderLeftColor: thread?.color || 'var(--border2)' }}>
      <div className={styles.cellHeader} onClick={() => setExpanded((v) => !v)}>
        <div className={styles.threadDot} style={{ background: thread?.color || 'var(--border2)' }} />
        <input className={styles.titleInput} value={title} onChange={(e) => { setTitle(e.target.value); save({ title: e.target.value }) }} onClick={(e) => e.stopPropagation()} placeholder="title..." />
        <button className={styles.expandBtn}>{expanded ? '▾' : '▸'}</button>
        <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onDelete() }}>✕</button>
      </div>
      {expanded && (
        <div className={styles.cellBody}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>thread</label>
            <select className={styles.select} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); save({ categoryId: e.target.value }) }}>
              <option value="">none</option>
              {threads.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>notes</label>
            <textarea className={styles.bodyInput} value={body} onChange={(e) => { setBody(e.target.value); save({ body: e.target.value }) }} placeholder="add notes..." rows={3} />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>tags</label>
            <div className={styles.tags}>
              {tags.map((tag) => <span key={tag} className={styles.tag}>{tag}<button onClick={() => { const t = tags.filter((x) => x !== tag); setTags(t); save({ tags: t }) }}>✕</button></span>)}
              <input className={styles.tagInput} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} placeholder="add tag..." />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
