import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project } from '../types'
import styles from './Home.module.css'

const COLORS = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#e67e22', '#16a085']

export function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const navigate = useNavigate()

  useEffect(() => { window.weave.projects.list().then(setProjects) }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    const p = await window.weave.projects.create({ name: newName.trim(), description: newDesc.trim(), color: newColor })
    setProjects((prev) => [p, ...prev])
    setShowNew(false); setNewName(''); setNewDesc('')
    navigate(`/project/${p.id}`)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await window.weave.projects.delete(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <div className={styles.logo}>weave</div>
        <button className={styles.newBtn} onClick={() => setShowNew(true)}>
          <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          new project
        </button>
      </header>
      <div className={styles.body}>
        {projects.length === 0 && !showNew && (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>no projects yet</div>
            <div className={styles.emptySub}>create your first project to start writing</div>
            <button className={styles.emptyBtn} onClick={() => setShowNew(true)}>+ new project</button>
          </div>
        )}
        <div className={styles.grid}>
          {showNew && (
            <div className={`${styles.card} ${styles.cardNew}`}>
              <div className={styles.cardNewInner}>
                <div className={styles.cardNewTitle}>new project</div>
                <input className={styles.cardInput} placeholder="project name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} autoFocus />
                <input className={styles.cardInput} placeholder="description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                <div className={styles.colorRow}>
                  {COLORS.map((c) => <button key={c} className={`${styles.colorDot} ${newColor === c ? styles.colorDotActive : ''}`} style={{ background: c }} onClick={() => setNewColor(c)} />)}
                </div>
                <div className={styles.cardNewBtns}>
                  <button className={styles.cancelBtn} onClick={() => setShowNew(false)}>cancel</button>
                  <button className={styles.createBtn} onClick={handleCreate}>create</button>
                </div>
              </div>
            </div>
          )}
          {projects.map((p) => (
            <div key={p.id} className={styles.card} onClick={() => navigate(`/project/${p.id}`)}>
              <div className={styles.cardAccent} style={{ background: p.color }} />
              <div className={styles.cardBody}>
                <div className={styles.cardName}>{p.name}</div>
                {p.description && <div className={styles.cardDesc}>{p.description}</div>}
                <div className={styles.cardMeta}>updated {fmt(p.updated_at)}</div>
              </div>
              <button className={styles.cardDelete} onClick={(e) => handleDelete(e, p.id)}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
