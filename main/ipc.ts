import { IpcMain } from 'electron'
import { db } from './db'
import { randomUUID } from 'crypto'

export function registerIPCHandlers(ipcMain: IpcMain) {

  // ── Projects ───────────────────────────────────────────────
  ipcMain.handle('projects:list', () =>
    db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all()
  )
  ipcMain.handle('projects:create', (_e, { name, description, color }: any) => {
    const id = randomUUID()
    db.prepare('INSERT INTO projects (id, name, description, color) VALUES (?,?,?,?)').run(id, name, description || '', color || '#c0392b')
    return db.prepare('SELECT * FROM projects WHERE id=?').get(id)
  })
  ipcMain.handle('projects:update', (_e, { id, name, description, color }: any) => {
    db.prepare('UPDATE projects SET name=?, description=?, color=?, updated_at=unixepoch() WHERE id=?').run(name, description, color, id)
    return db.prepare('SELECT * FROM projects WHERE id=?').get(id)
  })
  ipcMain.handle('projects:delete', (_e, id: string) => {
    db.prepare('DELETE FROM projects WHERE id=?').run(id)
    return { ok: true }
  })

  // ── Documents ──────────────────────────────────────────────
  ipcMain.handle('documents:list', (_e, projectId: string) =>
    db.prepare('SELECT * FROM documents WHERE project_id=? ORDER BY position ASC').all(projectId)
  )
  ipcMain.handle('documents:get', (_e, id: string) =>
    db.prepare('SELECT * FROM documents WHERE id=?').get(id)
  )
  ipcMain.handle('documents:create', (_e, { projectId, title }: any) => {
    const id = randomUUID()
    const pos = (db.prepare('SELECT COUNT(*) as c FROM documents WHERE project_id=?').get(projectId) as any).c
    db.prepare('INSERT INTO documents (id, project_id, title, position) VALUES (?,?,?,?)').run(id, projectId, title || 'Untitled', pos)
    return db.prepare('SELECT * FROM documents WHERE id=?').get(id)
  })
  ipcMain.handle('documents:update', (_e, { id, title, content }: any) => {
    db.prepare('UPDATE documents SET title=?, content=?, updated_at=unixepoch() WHERE id=?').run(title, content, id)
    return { ok: true }
  })
  ipcMain.handle('documents:delete', (_e, id: string) => {
    db.prepare('DELETE FROM documents WHERE id=?').run(id)
    return { ok: true }
  })

  // ── Thread Categories ──────────────────────────────────────
  ipcMain.handle('threads:list', (_e, projectId: string) =>
    db.prepare('SELECT * FROM thread_categories WHERE project_id=? ORDER BY position ASC').all(projectId)
  )
  ipcMain.handle('threads:create', (_e, { projectId, name, color }: any) => {
    const id = randomUUID()
    const pos = (db.prepare('SELECT COUNT(*) as c FROM thread_categories WHERE project_id=?').get(projectId) as any).c
    db.prepare('INSERT INTO thread_categories (id, project_id, name, color, position) VALUES (?,?,?,?,?)').run(id, projectId, name, color || '#4a9cf9', pos)
    return db.prepare('SELECT * FROM thread_categories WHERE id=?').get(id)
  })
  ipcMain.handle('threads:delete', (_e, id: string) => {
    db.prepare('DELETE FROM thread_categories WHERE id=?').run(id)
    return { ok: true }
  })

  // ── Ply Cells ──────────────────────────────────────────────
  ipcMain.handle('ply:cells:list', (_e, documentId: string) =>
    db.prepare('SELECT * FROM ply_cells WHERE document_id=? ORDER BY range_start ASC').all(documentId)
  )
  ipcMain.handle('ply:cells:create', (_e, cell: any) => {
    const id = randomUUID()
    const pos = (db.prepare('SELECT COUNT(*) as c FROM ply_cells WHERE document_id=?').get(cell.documentId) as any).c
    db.prepare(`INSERT INTO ply_cells (id, document_id, category_id, title, body, tags, range_start, range_end, position)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(
      id, cell.documentId, cell.categoryId || null,
      cell.title, cell.body, JSON.stringify(cell.tags || []),
      cell.rangeStart, cell.rangeEnd, pos
    )
    return db.prepare('SELECT * FROM ply_cells WHERE id=?').get(id)
  })
  ipcMain.handle('ply:cells:update', (_e, { id, title, body, tags, categoryId }: any) => {
    db.prepare('UPDATE ply_cells SET title=?, body=?, tags=?, category_id=? WHERE id=?')
      .run(title, body, JSON.stringify(tags || []), categoryId || null, id)
    return { ok: true }
  })
  ipcMain.handle('ply:cells:delete', (_e, id: string) => {
    db.prepare('DELETE FROM ply_cells WHERE id=?').run(id)
    return { ok: true }
  })

  // ── World Building ─────────────────────────────────────────
  ipcMain.handle('world:list', (_e, projectId: string) =>
    db.prepare('SELECT * FROM world_entries WHERE project_id=? ORDER BY type, name ASC').all(projectId)
  )
  ipcMain.handle('world:create', (_e, { projectId, type, name, data }: any) => {
    const id = randomUUID()
    db.prepare('INSERT INTO world_entries (id, project_id, type, name, data) VALUES (?,?,?,?,?)').run(id, projectId, type, name, JSON.stringify(data || {}))
    return db.prepare('SELECT * FROM world_entries WHERE id=?').get(id)
  })
  ipcMain.handle('world:update', (_e, { id, name, data }: any) => {
    db.prepare('UPDATE world_entries SET name=?, data=?, updated_at=unixepoch() WHERE id=?').run(name, JSON.stringify(data), id)
    return { ok: true }
  })
  ipcMain.handle('world:delete', (_e, id: string) => {
    db.prepare('DELETE FROM world_entries WHERE id=?').run(id)
    return { ok: true }
  })

  // ── Blobs ──────────────────────────────────────────────────
  ipcMain.handle('blobs:list', (_e, projectId: string) =>
    db.prepare('SELECT * FROM blobs WHERE project_id=?').all(projectId)
  )
  ipcMain.handle('blobs:create', (_e, { projectId, content, type, posX, posY }: any) => {
    const id = randomUUID()
    db.prepare('INSERT INTO blobs (id, project_id, content, type, pos_x, pos_y) VALUES (?,?,?,?,?,?)').run(id, projectId, content, type || 'text', posX || 100, posY || 100)
    return db.prepare('SELECT * FROM blobs WHERE id=?').get(id)
  })
  ipcMain.handle('blobs:update', (_e, { id, content, tags, color, posX, posY, width, height, priority }: any) => {
    db.prepare('UPDATE blobs SET content=?, tags=?, color=?, pos_x=?, pos_y=?, width=?, height=?, priority=? WHERE id=?')
      .run(content, JSON.stringify(tags || []), color, posX, posY, width, height, priority, id)
    return { ok: true }
  })
  ipcMain.handle('blobs:delete', (_e, id: string) => {
    db.prepare('DELETE FROM blobs WHERE id=?').run(id)
    return { ok: true }
  })
  ipcMain.handle('blobs:connections:list', (_e, projectId: string) =>
    db.prepare('SELECT bc.* FROM blob_connections bc JOIN blobs b ON bc.blob_from=b.id WHERE b.project_id=?').all(projectId)
  )
  ipcMain.handle('blobs:connections:create', (_e, { blobFrom, blobTo }: any) => {
    const id = randomUUID()
    db.prepare('INSERT INTO blob_connections (id, blob_from, blob_to) VALUES (?,?,?)').run(id, blobFrom, blobTo)
    return { ok: true, id }
  })
  ipcMain.handle('blobs:connections:delete', (_e, id: string) => {
    db.prepare('DELETE FROM blob_connections WHERE id=?').run(id)
    return { ok: true }
  })
}
