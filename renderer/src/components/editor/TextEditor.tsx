import { useRef, useEffect, useCallback, useState } from 'react'
import type { Document, PlyCell, ThreadCategory } from '../../types'
import styles from './TextEditor.module.css'

interface Props {
  document: Document
  plyCells: PlyCell[]
  threads: ThreadCategory[]
  openThreadIds: string[]
  onContentChange: (content: string) => void
  onCreatePlyCell: (data: {
    categoryId?: string; title: string; body: string
    tags: string[]; rangeStart: number; rangeEnd: number
  }) => void
  onToggleThread: (id: string) => void
}

export function TextEditor({ document, plyCells, threads, openThreadIds, onContentChange, onCreatePlyCell, onToggleThread }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectionTooltip, setSelectionTooltip] = useState<{ x: number; y: number; text: string; start: number; end: number } | null>(null)

  useEffect(() => {
    if (!editorRef.current) return
    editorRef.current.innerText = document.content || ''
    setSelectionTooltip(null)
  }, [document.id])

  const handleInput = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onContentChange(editorRef.current?.innerText || '')
    }, 800)
  }, [onContentChange])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // small delay so selection is fully committed
    setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setSelectionTooltip(null)
        return
      }
      const text = selection.toString().trim()
      const range = selection.getRangeAt(0)
      const preRange = window.document.createRange()
      preRange.selectNodeContents(editorRef.current!)
      preRange.setEnd(range.startContainer, range.startOffset)
      const rangeStart = preRange.toString().length
      const rangeEnd = rangeStart + selection.toString().length

      // show tooltip near selection
      const rect = range.getBoundingClientRect()
      const editorRect = editorRef.current!.getBoundingClientRect()
      setSelectionTooltip({
        x: rect.left - editorRect.left + rect.width / 2,
        y: rect.top - editorRect.top - 8,
        text,
        start: rangeStart,
        end: rangeEnd,
      })
    }, 10)
  }, [])

  const handleCreateCell = useCallback(() => {
    if (!selectionTooltip) return
    const categoryId = openThreadIds.length > 0 ? openThreadIds[0] : undefined
    onCreatePlyCell({
      categoryId,
      title: selectionTooltip.text.slice(0, 60),
      body: '',
      tags: [],
      rangeStart: selectionTooltip.start,
      rangeEnd: selectionTooltip.end,
    })
    window.getSelection()?.removeAllRanges()
    setSelectionTooltip(null)
  }, [selectionTooltip, openThreadIds, onCreatePlyCell])

  // hide tooltip on click elsewhere
  useEffect(() => {
    const handler = () => setSelectionTooltip(null)
    window.document.addEventListener('mousedown', handler)
    return () => window.document.removeEventListener('mousedown', handler)
  }, [])

  const indicatorsByThread = threads
    .filter((t) => plyCells.some((c) => c.category_id === t.id))
    .map((t) => ({ thread: t, count: plyCells.filter((c) => c.category_id === t.id).length }))

  return (
    <div className={styles.wrap}>
      <div className={styles.titleArea}>
        <h1 className={styles.docTitle}>{document.title}</h1>
      </div>
      <div className={styles.editorArea}>
        <div className={styles.margin}>
          {indicatorsByThread.map(({ thread, count }) => (
            <button
              key={thread.id}
              className={`${styles.indicator} ${openThreadIds.includes(thread.id) ? styles.indicatorActive : ''}`}
              style={{ '--indicator-color': thread.color } as React.CSSProperties}
              title={`${thread.name} (${count}) — click to open`}
              onClick={() => onToggleThread(thread.id)}
            >
              <div className={styles.indicatorBar} />
              {count > 1 && <span className={styles.indicatorCount}>{count}</span>}
            </button>
          ))}
        </div>

        <div className={styles.editorRelative}>
          <div
            ref={editorRef}
            className={styles.editor}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onMouseUp={handleMouseUp}
            data-placeholder="start writing... select text to create a ply cell"
            spellCheck
          />

          {/* selection tooltip */}
          {selectionTooltip && (
            <div
              className={styles.selectionTooltip}
              style={{ left: selectionTooltip.x, top: selectionTooltip.y }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button className={styles.tooltipBtn} onClick={handleCreateCell}>
                + ply cell
                {openThreadIds.length > 0 && (
                  <span className={styles.tooltipThread} style={{ background: threads.find(t => t.id === openThreadIds[0])?.color }}>
                    {threads.find(t => t.id === openThreadIds[0])?.name}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
