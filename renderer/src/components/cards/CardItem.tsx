import { useState, useRef, useCallback } from 'react'
import type { Blob as Card, ThreadCategory, PlyCell } from '../../types'
import styles from './CardItem.module.css'

const CARD_COLORS = [
  '#1a202e', '#1a2a1a', '#2a1a1a', '#1a1a2a', '#2a2a1a', '#1a2a2a'
]

interface Props {
  card: Card
  zoom: number
  threads: ThreadCategory[]
  plyCells: PlyCell[]
  onDrag: (dx: number, dy: number) => void
  onUpdate: (updates: Partial<Card>) => void
  onDelete: () => void
  onConnectStart: (originX: number, originY: number, screenX: number, screenY: number) => void
  isConnecting: boolean
}

export function CardItem({ card, zoom, threads, plyCells, onDrag, onUpdate, onDelete, onConnectStart, isConnecting }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)

  const tags: string[] = JSON.parse(card.tags || '[]')
  const linkedCell = card.type === 'thread_link' && card.link_id
    ? plyCells.find((c) => c.id === card.link_id)
    : null

  // ── drag to move ───────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return
    e.stopPropagation()
    dragStart.current = { x: e.clientX, y: e.clientY }
    isDragging.current = false

    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return
      const dx = ev.clientX - dragStart.current.x
      const dy = ev.clientY - dragStart.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.current = true
      if (isDragging.current) {
        onDrag(dx, dy)
        dragStart.current = { x: ev.clientX, y: ev.clientY }
      }
    }
    const onUp = () => {
      dragStart.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onDrag])

  // ── connect from any edge point ────────────────────────
  const handleEdgeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = cardRef.current!.getBoundingClientRect()
    // origin in screen coords
    const ox = e.clientX - rect.left + (card.pos_x * zoom)
    const oy = e.clientY - rect.top + (card.pos_y * zoom)
    // use actual screen coords for the SVG overlay
    const boardEl = cardRef.current!.closest('[class*="canvas"]') as HTMLElement
    const boardRect = boardEl?.getBoundingClientRect()
    const sx = e.clientX - (boardRect?.left || 0)
    const sy = e.clientY - (boardRect?.top || 0)
    onConnectStart(ox, oy, sx, sy)
  }, [card.pos_x, card.pos_y, zoom, onConnectStart])

  const addTag = () => {
    if (!tagInput.trim()) return
    const newTags = [...tags, tagInput.trim()]
    onUpdate({ tags: JSON.stringify(newTags) })
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    onUpdate({ tags: JSON.stringify(tags.filter((t) => t !== tag)) })
  }

  return (
    <div
      ref={cardRef}
      data-card={card.id}
      className={styles.card}
      style={{
        left: card.pos_x,
        top: card.pos_y,
        width: card.width,
        minHeight: card.height,
        background: card.color,
        zIndex: card.priority + 10,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* edge connector ring — hover reveals it */}
      <div
        className={styles.edgeRing}
        data-no-drag
        onMouseDown={handleEdgeMouseDown}
        title="drag to connect"
      />

      {/* card header */}
      <div className={styles.header}>
        <div className={styles.colorDots} data-no-drag>
          {CARD_COLORS.map((c) => (
            <button
              key={c}
              className={`${styles.colorDot} ${card.color === c ? styles.colorDotActive : ''}`}
              style={{ background: c === '#1a202e' ? 'var(--border2)' : c }}
              onClick={() => onUpdate({ color: c })}
            />
          ))}
        </div>
        <div className={styles.headerActions} data-no-drag>
          <button className={styles.expandBtn} onClick={() => setExpanded((v) => !v)} title="expand">
            {expanded ? '▾' : '▸'}
          </button>
          <button className={styles.deleteBtn} onClick={onDelete} title="delete">✕</button>
        </div>
      </div>

      {/* content */}
      <div className={styles.body} data-no-drag>
        {card.type === 'thread_link' && linkedCell ? (
          <div className={styles.linkedCell}>
            <div className={styles.linkedLabel}>linked cell</div>
            <div className={styles.linkedTitle}>{linkedCell.title}</div>
          </div>
        ) : (
          <textarea
            className={styles.content}
            value={card.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="write anything..."
            rows={3}
          />
        )}
      </div>

      {/* expanded details */}
      {expanded && (
        <div className={styles.details} data-no-drag>
          <div className={styles.tags}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
                <button onClick={() => removeTag(tag)}>✕</button>
              </span>
            ))}
            <input
              className={styles.tagInput}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="add tag..."
            />
          </div>
          <div className={styles.priorityRow}>
            <span className={styles.priorityLabel}>priority</span>
            {[0, 1, 2].map((p) => (
              <button
                key={p}
                className={`${styles.priorityBtn} ${card.priority === p ? styles.priorityBtnActive : ''}`}
                onClick={() => onUpdate({ priority: p })}
              >
                {p === 0 ? 'low' : p === 1 ? 'med' : 'high'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* resize handle */}
      <div
        className={styles.resizeHandle}
        data-no-drag
        onMouseDown={(e) => {
          e.stopPropagation()
          const startX = e.clientX
          const startW = card.width
          const startH = card.height
          const onMove = (ev: MouseEvent) => {
            const dw = (ev.clientX - startX) / zoom
            onUpdate({
              width: Math.max(180, startW + dw),
              height: Math.max(100, startH),
            })
          }
          const onUp = () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
          }
          window.addEventListener('mousemove', onMove)
          window.addEventListener('mouseup', onUp)
        }}
      />
    </div>
  )
}
