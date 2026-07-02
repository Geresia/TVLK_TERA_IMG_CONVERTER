import { useState, useCallback } from 'react'

const ACCEPTED_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'])

export function useFileQueue() {
  const [items, setItems] = useState([])

  const addFiles = useCallback((fileList) => {
    setItems(prev => {
      const existingKeys = new Set(prev.map(f => f.name + f.size))
      const newItems = Array.from(fileList)
        .filter(f => {
          const ext = f.name.split('.').pop().toLowerCase()
          return ACCEPTED_EXTS.has(ext) && !existingKeys.has(f.name + f.size)
        })
        .map(f => ({
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

  const updateItem = useCallback((id, patch) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))
  }, [])

  const pendingItems = items.filter(f => f.status === 'pending')

  return { items, pendingItems, addFiles, clearAll, updateItem }
}
