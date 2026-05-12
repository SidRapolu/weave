import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Project, Document, PlyCell, ThreadCategory } from '../types'
import { EditorSidebar } from '../components/editor/EditorSidebar'
import { TextEditor } from '../components/editor/TextEditor'
import { PlyPanel } from '../components/editor/PlyPanel'
import styles from './Editor.module.css'

export type EditorView = 'editor'| 'blobs'

export function Editor() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeDoc, setActiveDoc] = useState<Document | null>(null)
  const [plyCells, setPlyCells] = useState<PlyCell[]>([])
  const [threads, setThreads] = useState<ThreadCategory[]>([])
  const [openThreadIds, setOpenThreadIds] = useState<string[]>([]) // max 2, ephemeral
  const [view, setView] = useState<EditorView>('editor')

  useEffect(() => {
    if (!projectId) return
    window.weave.projects.list().then((ps) => {
      const p = ps.find((x) => x.id === projectId)
      if (!p) { navigate('/'); return }
      setProject(p)
    })
    window.weave.documents.list(projectId).then((docs) => {
      setDocuments(docs)
      if (docs.length > 0) loadDocument(docs[0])
    })
    window.weave.threads.list(projectId).then(setThreads)
  }, [projectId])

  const loadDocument = async (doc: Document) => {
    setActiveDoc(doc)
    setPlyCells(await window.weave.plyCells.list(doc.id))
    setOpenThreadIds([]) // close panels when switching docs
  }

  const updateDocContent = async (content: string) => {
    if (!activeDoc) return
    setActiveDoc((d) => d ? { ...d, content } : d)
    await window.weave.documents.update({ id: activeDoc.id, title: activeDoc.title, content })
  }

  // toggle a thread open/closed as a ply panel
  const toggleThreadPanel = (threadId: string) => {
    setOpenThreadIds((ids) => {
      if (ids.includes(threadId)) return ids.filter((x) => x !== threadId)
      if (ids.length >= 2) return [...ids.slice(1), threadId] // drop oldest if at max
      return [...ids, threadId]
    })
  }

  const createPlyCell = async (data: {
    categoryId?: string; title: string; body: string
    tags: string[]; rangeStart: number; rangeEnd: number
  }) => {
    if (!activeDoc) return
    const cell = await window.weave.plyCells.create({ ...data, documentId: activeDoc.id })
    setPlyCells((c) => [...c, cell])
  }

  const updatePlyCell = async (id: string, data: { title: string; body: string; tags: string[]; categoryId?: string }) => {
    await window.weave.plyCells.update({ id, ...data })
    setPlyCells((c) => c.map((x) => x.id === id ? { ...x, title: data.title, body: data.body, tags: JSON.stringify(data.tags), category_id: data.categoryId || null } : x))
  }

  const deletePlyCell = async (id: string) => {
    await window.weave.plyCells.delete(id)
    setPlyCells((c) => c.filter((x) => x.id !== id))
  }

  const openPanelCount = openThreadIds.length
  const editorWidth = openPanelCount === 0 ? '100%' : openPanelCount === 1 ? '55%' : '40%'

  return (
    <div className={styles.editor}>
      <div className={styles.titlebar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className={styles.projectName}>{project?.name}</div>
        <div className={styles.tabs}>
          {(['editor', 'blobs'] as EditorView[]).map((v) => (
            <button key={v} className={`${styles.tab} ${view === v ? styles.tabActive : ''}`} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        <EditorSidebar
          documents={documents}
          activeDocId={activeDoc?.id}
          onSelect={loadDocument}
          onCreate={async (title) => {
            if (!projectId) return
            const doc = await window.weave.documents.create({ projectId, title })
            setDocuments((d) => [...d, doc])
            loadDocument(doc)
          }}
          onDelete={async (id) => {
            await window.weave.documents.delete(id)
            setDocuments((d) => d.filter((x) => x.id !== id))
            if (activeDoc?.id === id) setActiveDoc(null)
          }}
          threads={threads}
          openThreadIds={openThreadIds}
          onToggleThread={toggleThreadPanel}
          projectId={projectId!}
          onThreadsChange={setThreads}
        />

        {view === 'editor' && (
          <div className={styles.editorArea}>
            {activeDoc ? (
              <div className={styles.editorRow}>
                <div className={styles.textEditorWrap} style={{ width: editorWidth }}>
                  <TextEditor
                    document={activeDoc}
                    plyCells={plyCells}
                    threads={threads}
                    openThreadIds={openThreadIds}
                    onContentChange={updateDocContent}
                    onCreatePlyCell={createPlyCell}
                    onToggleThread={toggleThreadPanel}
                  />
                </div>
                {openThreadIds.map((threadId) => {
                  const thread = threads.find((t) => t.id === threadId)
                  if (!thread) return null
                  return (
                    <div key={threadId} className={styles.plyWrap}>
                      <PlyPanel
                        thread={thread}
                        cells={plyCells.filter((c) => c.category_id === threadId)}
                        threads={threads}
                        onClose={() => toggleThreadPanel(threadId)}
                        onUpdateCell={updatePlyCell}
                        onDeleteCell={deletePlyCell}
                        onCreateCell={(title) => createPlyCell({ categoryId: threadId, title, body: '', tags: [], rangeStart: 0, rangeEnd: 0 })}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={styles.noDoc}><div className={styles.noDocText}>select or create a document</div></div>
            )}
          </div>
        )}

        {view === 'blobs' && (
          <div className={styles.editorArea}>
            <div className={styles.noDoc}><div className={styles.noDocText}>blob board — coming soon</div></div>
          </div>
        )}
      </div>
    </div>
  )
}
