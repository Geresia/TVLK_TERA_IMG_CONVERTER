import { useState, useCallback } from 'react'
import type { ProcessResult } from '../lib/imageProcessor'

const ACCEPTED_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'])

export type FileStatus = 'pending' | 'processing' | 'ok' | 'err'

export interface FileItem {
  id: string
  file: File
  name: string
  size: number
  status: FileStatus
  result: Omit<ProcessResult, 'blob' | 'baseName'> | null
  error: string | null
}

export function useFileQueue() {
  const [items, setItems] = useState<FileItem[]>([])

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return
    setItems(prev => {
      const existingKeys = new Set(prev.map(f => f.name + f.size))
      const newItems = Array.from(fileList)
        .filter(f => {
          const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
          return ACCEPTED_EXTS.has(ext) && !existingKeys.has(f.name + f.size)
        })
        .map<FileItem>(f => ({
          id: crypto.randomUUID(),
          file: f,
          name: f.name,
          size: f.size,
          status: 'pending',
          result: null,
          error: null,
        }))
      return [...prev, ...newItems]
    })
  }, [])

  const addFileArray = useCallback((files: File[]) => {
    setItems(prev => {
      const existingKeys = new Set(prev.map(f => f.name + f.size))
      const newItems = files
        .filter(f => !existingKeys.has(f.name + f.size))
        .map<FileItem>(f => ({
          id: crypto.randomUUID(),
          file: f,
          name: f.name,
          size: f.size,
          status: 'pending',
          result: null,
          error: null,
        }))
      return [...prev, ...newItems]
    })
  }, [])

  const clearAll = useCallback(() => setItems([]), [])

  const updateItem = useCallback((id: string, patch: Partial<FileItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))
  }, [])

  const pendingItems = items.filter(f => f.status === 'pending')

  return { items, pendingItems, addFiles, addFileArray, clearAll, updateItem }
}
