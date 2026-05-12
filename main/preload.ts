import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('weave', {
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    create: (data: any) => ipcRenderer.invoke('projects:create', data),
    update: (data: any) => ipcRenderer.invoke('projects:update', data),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id),
  },
  documents: {
    list: (projectId: string) => ipcRenderer.invoke('documents:list', projectId),
    get: (id: string) => ipcRenderer.invoke('documents:get', id),
    create: (data: any) => ipcRenderer.invoke('documents:create', data),
    update: (data: any) => ipcRenderer.invoke('documents:update', data),
    delete: (id: string) => ipcRenderer.invoke('documents:delete', id),
  },
  threads: {
    list: (projectId: string) => ipcRenderer.invoke('threads:list', projectId),
    create: (data: any) => ipcRenderer.invoke('threads:create', data),
    delete: (id: string) => ipcRenderer.invoke('threads:delete', id),
  },
  plyColumns: {
    list: (documentId: string) => ipcRenderer.invoke('ply:columns:list', documentId),
    create: (data: any) => ipcRenderer.invoke('ply:columns:create', data),
    delete: (id: string) => ipcRenderer.invoke('ply:columns:delete', id),
  },
  plyCells: {
    list: (documentId: string) => ipcRenderer.invoke('ply:cells:list', documentId),
    create: (data: any) => ipcRenderer.invoke('ply:cells:create', data),
    update: (data: any) => ipcRenderer.invoke('ply:cells:update', data),
    delete: (id: string) => ipcRenderer.invoke('ply:cells:delete', id),
  },
  world: {
    list: (projectId: string) => ipcRenderer.invoke('world:list', projectId),
    create: (data: any) => ipcRenderer.invoke('world:create', data),
    update: (data: any) => ipcRenderer.invoke('world:update', data),
    delete: (id: string) => ipcRenderer.invoke('world:delete', id),
  },
  blobs: {
    list: (projectId: string) => ipcRenderer.invoke('blobs:list', projectId),
    create: (data: any) => ipcRenderer.invoke('blobs:create', data),
    update: (data: any) => ipcRenderer.invoke('blobs:update', data),
    delete: (id: string) => ipcRenderer.invoke('blobs:delete', id),
    connections: {
      list: (projectId: string) => ipcRenderer.invoke('blobs:connections:list', projectId),
      create: (data: any) => ipcRenderer.invoke('blobs:connections:create', data),
      delete: (id: string) => ipcRenderer.invoke('blobs:connections:delete', id),
    },
  },
})
