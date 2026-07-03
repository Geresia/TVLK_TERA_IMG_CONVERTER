import { useState, useRef } from 'react'
import DropZone from './components/DropZone'
import FileList from './components/FileList'
import ProgressBar from './components/ProgressBar'
import { useFileQueue } from './hooks/useFileQueue'
import { processImage, saveToDir, downloadBlob } from './lib/imageProcessor'

export default function App() {
  const { items, pendingItems, addFiles, addFileArray, clearAll, updateItem } = useFileQueue()
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const isProcessing = useRef(false)

  const fetchFromUrl = async () => {
    const raw = urlInput.trim()
    if (!raw) return
    setUrlError('')
    try {
      new URL(raw)
    } catch {
      setUrlError('Invalid URL')
      return
    }
    try {
      const res = await fetch(raw)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      if (!blob.type.startsWith('image/')) throw new Error('Not an image')
      const fileName = raw.split('/').pop()?.split('?')[0] || 'image.jpg'
      const file = new File([blob], fileName, { type: blob.type })
      addFileArray([file])
      setUrlInput('')
    } catch (e: any) {
      setUrlError(e.message ?? 'Failed to fetch')
    }
  }

  const run = async (onResult: (blob: Blob, fileName: string) => Promise<void> | void) => {
    if (isProcessing.current || pendingItems.length === 0) return
    isProcessing.current = true

    let done = 0
    setProgress({ done: 0, total: pendingItems.length })

    for (const item of pendingItems) {
      updateItem(item.id, { status: 'processing' })
      try {
        const result = await processImage(item.file)
        await onResult(result.blob, result.baseName + '.jpg')
        updateItem(item.id, { status: 'ok', result: { width: result.width, height: result.height, ratio: result.ratio } })
      } catch (e: any) {
        updateItem(item.id, { status: 'err', error: e.message?.slice(0, 40) ?? 'Error' })
      }
      done++
      setProgress({ done, total: pendingItems.length })
    }

    isProcessing.current = false
    setProgress(null)
  }

  const handleSave = () => run((blob, fileName) => downloadBlob(blob, fileName))

  const handleSaveAs = async () => {
    let dirHandle: FileSystemDirectoryHandle
    try {
      dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error(e)
      return
    }
    run((blob, fileName) => saveToDir(blob, fileName, dirHandle))
  }

  const doneCount = items.filter(f => f.status === 'ok').length
  const errCount  = items.filter(f => f.status === 'err').length
  const busy = !!progress

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <header className="flex items-center gap-3 px-5 py-3.5 bg-blue-500 text-white shadow">
        <h1 className="text-sm font-semibold tracking-wide">TERA Image Converter</h1>
      </header>

      <main className="flex flex-col flex-1 gap-3 p-4 overflow-hidden max-w-4xl w-full mx-auto">

        <DropZone onFiles={addFiles} />

        {/* URL input */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setUrlError('') }}
              onKeyDown={e => e.key === 'Enter' && fetchFromUrl()}
              placeholder="Paste image URL and press Enter"
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={fetchFromUrl}
              disabled={!urlInput.trim()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
          {urlError && <p className="text-xs text-red-500 pl-1">{urlError}</p>}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs text-slate-500">
            {items.length === 0
              ? 'Add images to get started'
              : busy
                ? `Converting... (${progress.done}/${progress.total})`
                : doneCount + errCount > 0
                  ? `Done ${doneCount}${errCount ? ` · Failed ${errCount}` : ''}`
                  : `${items.length} files · ${pendingItems.length} pending`
            }
          </span>

          <button
            onClick={clearAll}
            disabled={busy || items.length === 0}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>

          <button
            onClick={handleSaveAs}
            disabled={busy || pendingItems.length === 0}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save As
          </button>

          <button
            onClick={handleSave}
            disabled={busy || pendingItems.length === 0}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? 'Converting...' : 'Save'}
          </button>
        </div>

        {progress && <ProgressBar done={progress.done} total={progress.total} />}

        <FileList items={items} />
      </main>
    </div>
  )
}
