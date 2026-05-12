import { useState } from 'react'
import type { Document, ThreadCategory } from '../../types'
import styles from './EditorSidebar.module.css'

interface Props {
  documents: Document[]
  activeDocId?: string
  onSelect: (doc: Document) => void
  onCreate: (title: string) => void
  onDelete: (id: string) => void
  threads: ThreadCategory[]
  openThreadIds: string[]
  onToggleThread: (id: string) => void
  projectId: string
  onThreadsChange: (threads: ThreadCategory[]) => void
}

const THREAD_COLORS = ['#4a9cf9','#c0392b','#27ae60','#f59e0b','#8e44ad','#e67e22','#16a085','#e91e63']

export function EditorSidebar({ documents, activeDocId, onSelect, onCreate, onDelete, threads, openThreadIds, onToggleThread, projectId, onThreadsChange }: Props) {
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [addingThread, setAddingThread] = useState(false)
  const [threadName, setThreadName] = useState('')
  const [threadColor, setThreadColor] = useState(THREAD_COLORS[0])

  const handleCreateDoc = () => {
    if (!newTitle.trim()) return
    onCreate(newTitle.trim())
    setNewTitle('')
    setCreating(false)
  }

  const handleAddThread = async () => {
    const name = threadName.trim()
    if (!name) return
    try {
      const t = await window.weave.threads.create({ projectId, name, color: threadColor })
      onThreadsChange([...threads, t])
      setThreadName('')
      setAddingThread(false)
    } catch (e) {
      console.error('failed to create thread', e)
    }
  }

  return (
    <aside className={styles.sidebar}>
      {/* documents */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>documents</span>
          <button className={styles.addBtn} onMouseDown={(e) => { e.preventDefault(); setCreating(true) }}>+</button>
        </div>
        {creating && (
          <div className={styles.newItem}>
            <input
              className={styles.newInput}
              placeholder="document title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateDoc()
                if (e.key === 'Escape') { setCreating(false); setNewTitle('') }
              }}
              autoFocus
            />
          </div>
        )}
        <div className={styles.list}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`${styles.docItem} ${activeDocId === doc.id ? styles.docItemActive : ''}`}
              onClick={() => onSelect(doc)}
            >
              <svg className={styles.docIcon} viewBox="0 0 12 12" fill="none">
                <path d="M2 1.5h8v9H2z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round"/>
                <path d="M4 4h4M4 6h4M4 8h2" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
              </svg>
              <span className={styles.docName}>{doc.title}</span>
              <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(doc.id) }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* threads */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>threads</span>
          <button className={styles.addBtn} onMouseDown={(e) => { e.preventDefault(); setAddingThread(true) }}>+</button>
        </div>
        {addingThread && (
          <div className={styles.newThread}>
            <input
              className={styles.newInput}
              placeholder="thread name"
              value={threadName}
              onChange={(e) => setThreadName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddThread()
                if (e.key === 'Escape') { setAddingThread(false); setThreadName('') }
              }}
              autoFocus
            />
            <div className={styles.colorPicker}>
              {THREAD_COLORS.map((c) => (
                <button
                  key={c}
                  className={`${styles.colorDot} ${threadColor === c ? styles.colorDotActive : ''}`}
                  style={{ background: c }}
                  onMouseDown={(e) => { e.preventDefault(); setThreadColor(c) }}
                />
              ))}
            </div>
            <div className={styles.threadBtns}>
              <button className={styles.cancelBtn} onClick={() => { setAddingThread(false); setThreadName('') }}>cancel</button>
              <button className={styles.createBtn} onClick={handleAddThread}>add</button>
            </div>
          </div>
        )}
        <div className={styles.list}>
          {threads.map((t) => {
            const isOpen = openThreadIds.includes(t.id)
            return (
              <div key={t.id} className={`${styles.threadItem} ${isOpen ? styles.threadItemOpen : ''}`}>
                <div className={styles.threadDot} style={{ background: t.color }} />
                <span className={styles.threadName}>{t.name}</span>
                <button
                  className={`${styles.plyToggle} ${isOpen ? styles.plyToggleOpen : ''}`}
                  onClick={() => onToggleThread(t.id)}
                  title={isOpen ? 'close ply' : 'open as ply'}
                >
                  {isOpen ? '▶' : '▷'}
                </button>
                <button className={styles.deleteBtn} onClick={async () => {
                  await window.weave.threads.delete(t.id)
                  onThreadsChange(threads.filter((x) => x.id !== t.id))
                }}>✕</button>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
