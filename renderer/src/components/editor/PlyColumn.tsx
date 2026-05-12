import { useState } from 'react'
import type { PlyColumn, PlyCell, ThreadCategory } from '../../types'
import { PlyCellComponent } from './PlyCell'
import styles from './PlyColumn.module.css'

interface Props {
  column: PlyColumn
  cells: PlyCell[]
  threads: ThreadCategory[]
  onRemoveColumn: () => void
  onUpdateCell: (id: string, data: any) => void
  onDeleteCell: (id: string) => void
}

export function PlyColumnComponent({ column, cells, threads, onRemoveColumn, onUpdateCell, onDeleteCell }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <span className={styles.name}>{column.name}</span>
        <div className={styles.headerActions}>
          <span className={styles.count}>{cells.length}</span>
          {confirmDelete ? (
            <>
              <button className={styles.confirmDelete} onClick={onRemoveColumn}>remove</button>
              <button className={styles.cancelDelete} onClick={() => setConfirmDelete(false)}>cancel</button>
            </>
          ) : (
            <button className={styles.deleteColBtn} onClick={() => setConfirmDelete(true)}>✕</button>
          )}
        </div>
      </div>
      <div className={styles.cells}>
        {cells.length === 0 && <div className={styles.empty}>select text in the editor to create a ply cell</div>}
        {cells.map((cell) => (
          <PlyCellComponent key={cell.id} cell={cell} threads={threads} onUpdate={(data) => onUpdateCell(cell.id, data)} onDelete={() => onDeleteCell(cell.id)} />
        ))}
      </div>
    </div>
  )
}
