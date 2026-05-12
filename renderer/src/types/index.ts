export interface Project {
  id: string
  name: string
  description: string
  color: string
  created_at: number
  updated_at: number
}

export interface Document {
  id: string
  project_id: string
  title: string
  content: string
  position: number
  created_at: number
  updated_at: number
}

export interface ThreadCategory {
  id: string
  project_id: string
  name: string
  color: string
  position: number
}

export interface PlyCell {
  id: string
  document_id: string
  category_id: string | null
  title: string
  body: string
  tags: string       // JSON string
  range_start: number
  range_end: number
  position: number
}

export interface WorldEntry {
  id: string
  project_id: string
  type: 'character' | 'setting' | 'other'
  name: string
  data: string
  created_at: number
  updated_at: number
}

export interface Blob {
  id: string
  project_id: string
  content: string
  type: 'text' | 'thread_link'
  tags: string
  color: string
  pos_x: number
  pos_y: number
  width: number
  height: number
  priority: number
}

export interface BlobConnection {
  id: string
  blob_from: string
  blob_to: string
}

declare global {
  interface Window {
    weave: {
      projects: {
        list: () => Promise<Project[]>
        create: (data: { name: string; description: string; color: string }) => Promise<Project>
        update: (data: { id: string; name: string; description: string; color: string }) => Promise<Project>
        delete: (id: string) => Promise<{ ok: boolean }>
      }
      documents: {
        list: (projectId: string) => Promise<Document[]>
        get: (id: string) => Promise<Document>
        create: (data: { projectId: string; title: string }) => Promise<Document>
        update: (data: { id: string; title: string; content: string }) => Promise<{ ok: boolean }>
        delete: (id: string) => Promise<{ ok: boolean }>
      }
      threads: {
        list: (projectId: string) => Promise<ThreadCategory[]>
        create: (data: { projectId: string; name: string; color: string }) => Promise<ThreadCategory>
        delete: (id: string) => Promise<{ ok: boolean }>
      }
      plyCells: {
        list: (documentId: string) => Promise<PlyCell[]>
        create: (data: {
          documentId: string
          categoryId?: string
          title: string
          body: string
          tags: string[]
          rangeStart: number
          rangeEnd: number
        }) => Promise<PlyCell>
        update: (data: { id: string; title: string; body: string; tags: string[]; categoryId?: string }) => Promise<{ ok: boolean }>
        delete: (id: string) => Promise<{ ok: boolean }>
      }
      world: {
        list: (projectId: string) => Promise<WorldEntry[]>
        create: (data: any) => Promise<WorldEntry>
        update: (data: any) => Promise<{ ok: boolean }>
        delete: (id: string) => Promise<{ ok: boolean }>
      }
      cards: {
        list: (projectId: string) => Promise<Blob[]>
        create: (data: any) => Promise<Blob>
        update: (data: any) => Promise<{ ok: boolean }>
        delete: (id: string) => Promise<{ ok: boolean }>
        connections: {
          list: (projectId: string) => Promise<BlobConnection[]>
          create: (data: any) => Promise<{ ok: boolean; id: string }>
          delete: (id: string) => Promise<{ ok: boolean }>
        }
      }
    }
  }
}
