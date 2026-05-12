import { useState, useEffect, useRef, useCallback } from 'react'
import type { Blob as Card, BlobConnection as CardConnection, ThreadCategory, PlyCell } from '../../types'
import { CardItem } from './CardItem'
import styles from './CardBoard.module.css'

interface Props {
  projectId: string
  threads: ThreadCategory[]
  plyCells: PlyCell[]
}

interface ConnectingState {
  cardId: string
  startX: number
  startY: number
  currentX: number
  currentY: number
  // exact point on card edge in canvas coords
  originX: number
  originY: number
}

export function CardBoard({ projectId, threads, plyCells }: Props) {
  const [cards, setCards] = useState<Card[]>([])
  const [connections, setConnections] = useState<CardConnection[]>([])
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [connecting, setConnecting] = useState<ConnectingState | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const boardRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const saveTimer = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    window.weave.blobs.list(projectId).then(setCards)
    window.weave.blobs.connections.list(projectId).then(setConnections)
  }, [projectId])

  const screenToCanvas = useCallback((sx: number, sy: number) => {
    const rect = boardRef.current!.getBoundingClientRect()
    return {
      x: (sx - rect.left - pan.x) / zoom,
      y: (sy - rect.top - pan.y) / zoom,
    }
  }, [pan, zoom])

  // ── card creation ────────────────────────────────────────
  const handleDblClick = useCallback(async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return
    const pos = screenToCanvas(e.clientX, e.clientY)
    const card = await window.weave.blobs.create({
      projectId, content: '', type: 'text',
      posX: pos.x - 100, posY: pos.y - 60,
    })
    setCards((c) => [...c, card])
  }, [projectId, screenToCanvas])

  // ── card drag ────────────────────────────────────────────
  const handleCardDrag = useCallback((id: string, dx: number, dy: number) => {
    setCards((cs) => cs.map((c) => {
      if (c.id !== id) return c
      const nx = c.pos_x + dx / zoom
      const ny = c.pos_y + dy / zoom
      // debounced save
      const prev = saveTimer.current.get(id)
      if (prev) clearTimeout(prev)
      saveTimer.current.set(id, setTimeout(() => {
        window.weave.blobs.update({ id, content: c.content, tags: JSON.parse(c.tags || '[]'), color: c.color, posX: nx, posY: ny, width: c.width, height: c.height, priority: c.priority })
      }, 400))
      return { ...c, pos_x: nx, pos_y: ny }
    }))
  }, [zoom])

  // ── card update ──────────────────────────────────────────
  const handleCardUpdate = useCallback((id: string, updates: Partial<Card>) => {
    setCards((cs) => cs.map((c) => c.id === id ? { ...c, ...updates } : c))
    const card = cards.find((c) => c.id === id)
    if (!card) return
    const merged = { ...card, ...updates }
    const prev = saveTimer.current.get(id + '_content')
    if (prev) clearTimeout(prev)
    saveTimer.current.set(id + '_content', setTimeout(() => {
      window.weave.blobs.update({
        id, content: merged.content, tags: JSON.parse(merged.tags || '[]'),
        color: merged.color, posX: merged.pos_x, posY: merged.pos_y,
        width: merged.width, height: merged.height, priority: merged.priority,
      })
    }, 600))
  }, [cards])

  const handleCardDelete = useCallback(async (id: string) => {
    await window.weave.blobs.delete(id)
    setCards((c) => c.filter((x) => x.id !== id))
    setConnections((c) => c.filter((x) => x.blob_from !== id && x.blob_to !== id))
  }, [])

  // ── connections ──────────────────────────────────────────
  const handleConnectStart = useCallback((cardId: string, originX: number, originY: number, screenX: number, screenY: number) => {
    setConnecting({ cardId, startX: screenX, startY: screenY, currentX: screenX, currentY: screenY, originX, originY })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = boardRef.current!.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })

    if (connecting) {
      setConnecting((c) => c ? { ...c, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top } : null)
    }

    if (isPanning.current) {
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      })
    }
  }, [connecting])

  const handleMouseUp = useCallback(async (e: React.MouseEvent) => {
    if (connecting) {
      // check if released over a card
      const target = (e.target as HTMLElement).closest('[data-card]')
      const targetId = target?.getAttribute('data-card')
      if (targetId && targetId !== connecting.cardId) {
        // find the exact point on target card edge closest to mouse
        const targetCard = cards.find((c) => c.id === targetId)
        if (targetCard) {
          const existing = connections.find(
            (c) => (c.blob_from === connecting.cardId && c.blob_to === targetId) ||
                   (c.blob_from === targetId && c.blob_to === connecting.cardId)
          )
          if (!existing) {
            const result = await window.weave.blobs.connections.create({ blobFrom: connecting.cardId, blobTo: targetId })
            setConnections((c) => [...c, { id: result.id, blob_from: connecting.cardId, blob_to: targetId }])
          }
        }
      }
      setConnecting(null)
    }
    isPanning.current = false
  }, [connecting, cards, connections])

  const handleBoardMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return
    if (e.button === 0) {
      isPanning.current = true
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    }
  }, [pan])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = boardRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const nz = Math.min(Math.max(zoom * delta, 0.2), 3)
    setPan((p) => ({ x: mx - (mx - p.x) * (nz / zoom), y: my - (my - p.y) * (nz / zoom) }))
    setZoom(nz)
  }, [zoom])

  const deleteConnection = useCallback(async (id: string) => {
    await window.weave.blobs.connections.delete(id)
    setConnections((c) => c.filter((x) => x.id !== id))
  }, [])

  // ── SVG edges ────────────────────────────────────────────
  const getCardCenter = (card: Card) => ({
    x: (card.pos_x + card.width / 2) * zoom + pan.x,
    y: (card.pos_y + card.height / 2) * zoom + pan.y,
  })

  const getCardEdgePoint = (card: Card, targetX: number, targetY: number) => {
    const cx = (card.pos_x + card.width / 2) * zoom + pan.x
    const cy = (card.pos_y + card.height / 2) * zoom + pan.y
    const hw = (card.width / 2) * zoom
    const hh = (card.height / 2) * zoom
    const dx = targetX - cx
    const dy = targetY - cy
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (absDx === 0 && absDy === 0) return { x: cx, y: cy }
    const sx = dx > 0 ? 1 : -1
    const sy = dy > 0 ? 1 : -1
    if (absDx / hw > absDy / hh) {
      return { x: cx + sx * hw, y: cy + (dy / absDx) * hw }
    } else {
      return { x: cx + (dx / absDy) * hh, y: cy + sy * hh }
    }
  }

  const renderConnections = () => {
    return connections.map((conn) => {
      const from = cards.find((c) => c.id === conn.blob_from)
      const to = cards.find((c) => c.id === conn.blob_to)
      if (!from || !to) return null

      const toCenter = getCardCenter(to)
      const fromCenter = getCardCenter(from)
      const p1 = getCardEdgePoint(from, toCenter.x, toCenter.y)
      const p2 = getCardEdgePoint(to, fromCenter.x, fromCenter.y)

      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const dist = Math.hypot(dx, dy)
      const curve = Math.min(dist * 0.4, 120)
      // control points curve outward
      const cx1 = p1.x + dx * 0.25 + (dy / dist) * curve
      const cy1 = p1.y + dy * 0.25 - (dx / dist) * curve
      const cx2 = p2.x - dx * 0.25 + (dy / dist) * curve
      const cy2 = p2.y - dy * 0.25 - (dx / dist) * curve

      const d = `M${p1.x},${p1.y} C${cx1},${cy1} ${cx2},${cy2} ${p2.x},${p2.y}`

      return (
        <g key={conn.id}>
          {/* thick invisible hit area */}
          <path d={d} fill="none" stroke="transparent" strokeWidth="16" style={{ cursor: 'pointer' }} onClick={() => deleteConnection(conn.id)} />
          {/* visible stretch line */}
          <path d={d} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" strokeLinecap="round" />
          <path d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
        </g>
      )
    })
  }

  const renderDragLine = () => {
    if (!connecting) return null
    const fromCard = cards.find((c) => c.id === connecting.cardId)
    if (!fromCard) return null

    const p1 = { x: connecting.originX, y: connecting.originY }
    const p2 = { x: connecting.currentX, y: connecting.currentY }
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const dist = Math.max(Math.hypot(dx, dy), 1)
    const cx1 = p1.x + dx * 0.4 + (dy / dist) * 40
    const cy1 = p1.y + dy * 0.4 - (dx / dist) * 40
    const cx2 = p2.x - dx * 0.3
    const cy2 = p2.y - dy * 0.3

    return (
      <g>
        <path d={`M${p1.x},${p1.y} C${cx1},${cy1} ${cx2},${cy2} ${p2.x},${p2.y}`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />
        <circle cx={p2.x} cy={p2.y} r="4" fill="rgba(255,255,255,0.4)" />
      </g>
    )
  }

  return (
    <div className={styles.board}>
      <div className={styles.toolbar}>
        <span className={styles.hint}>double-click to create a card · drag edge to connect · click connection to delete</span>
        <div className={styles.zoomBtns}>
          <button className={styles.zoomBtn} onClick={() => setZoom((z) => Math.min(z * 1.2, 3))}>+</button>
          <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <button className={styles.zoomBtn} onClick={() => setZoom((z) => Math.max(z * 0.8, 0.2))}>−</button>
        </div>
      </div>

      <div
        ref={boardRef}
        className={styles.canvas}
        onDoubleClick={handleDblClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleBoardMouseDown}
        onWheel={handleWheel}
        style={{ cursor: isPanning.current ? 'grabbing' : 'default' }}
      >
        {/* connection SVG layer */}
        <svg className={styles.svg}>
          {renderConnections()}
          {renderDragLine()}
        </svg>

        {/* cards layer */}
        <div className={styles.scene} style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              zoom={zoom}
              threads={threads}
              plyCells={plyCells}
              onDrag={(dx, dy) => handleCardDrag(card.id, dx, dy)}
              onUpdate={(updates) => handleCardUpdate(card.id, updates)}
              onDelete={() => handleCardDelete(card.id)}
              onConnectStart={(ox, oy, sx, sy) => handleConnectStart(card.id, ox, oy, sx, sy)}
              isConnecting={!!connecting}
            />
          ))}
        </div>

        {cards.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>double-click anywhere to create a card</div>
          </div>
        )}
      </div>
    </div>
  )
}
