import { useState } from 'react'
import type { PlyCell, ThreadCategory } from '../../types'
import { PlyCellComponent } from './PlyCell'
import styles from './PlyPanel.module.css'

interface Props {
  thread: ThreadCategory
  cells: PlyCell[]
  threads: ThreadCategory[]
  onClose: () => void
  onUpdateCell: (id: string, data: any) => void
  onDeleteCell: (id: string) => void
  onCreateCell: (title: string) => void
}

export function PlyPanel({ thread, cells, threads, onClose, onUpdateCell, onDeleteCell, onCreateCell }: Props) {
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = () => {
    if (!newTitle.trim()) return
    onCreateCell(newTitle.trim())
    setNewTitle('')
    setAdding(false)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.threadDot} style={{ background: thread.color }} />
        <span className={styles.name}>{thread.name}</span>
        <span className={styles.count}>{cells.length}</span>
        <button className={styles.addCellBtn} onClick={() => setAdding(true)} title="add cell">+</button>
        <button className={styles.closeBtn} onClick={onClose} title="close ply">✕</button>
      </div>

      <div className={styles.cells}>
        {adding && (
          <div className={styles.newCell}>
            <input
              className={styles.newCellInput}
              placeholder="cell title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              autoFocus
            />
            <div className={styles.newCellBtns}>
              <button className={styles.cancelBtn} onClick={() => setAdding(false)}>cancel</button>
              <button className={styles.createBtn} onClick={handleAdd}>add</button>
            </div>
          </div>
        )}

        {cells.length === 0 && !adding && (
          <div className={styles.empty}>
            select text in the editor or click + to add a cell to this thread
          </div>
        )}

        {cells.map((cell) => (
          <PlyCellComponent
            key={cell.id}
            cell={cell}
            threads={threads}
            onUpdate={(data) => onUpdateCell(cell.id, data)}
            onDelete={() => onDeleteCell(cell.id)}
          />
        ))}
      </div>
    </div>
  )
}
