import { useState, useRef } from 'react'
import DropZone from './components/DropZone'
import FileList from './components/FileList'
import ProgressBar from './components/ProgressBar'
import { useFileQueue } from './hooks/useFileQueue'
import { processImage } from './lib/imageProcessor'

export default function App() {
  const { items, pendingItems, addFiles, clearAll, updateItem } = useFileQueue()
  const [outDir, setOutDir] = useState(null)
  const [progress, setProgress] = useState(null)
  const isProcessing = useRef(false)

  const pickFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      setOutDir(handle)
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e)
    }
  }

  const handleProcess = async () => {
    if (!outDir || isProcessing.current || pendingItems.length === 0) return
    isProcessing.current = true

    let done = 0
    setProgress({ done: 0, total: pendingItems.length })

    for (const item of pendingItems) {
      updateItem(item.id, { status: 'processing' })
      try {
        const result = await processImage(item.file, outDir)
        updateItem(item.id, { status: 'ok', result })
      } catch (e) {
        updateItem(item.id, { status: 'err', error: e.message?.slice(0, 40) ?? 'Error' })
      }
      done++
      setProgress({ done, total: pendingItems.length })
    }

    isProcessing.current = false
    setProgress(null)
  }

  const doneCount = items.filter(f => f.status === 'ok').length
  const errCount  = items.filter(f => f.status === 'err').length
  const busy = !!progress

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3.5 bg-blue-500 text-white shadow">
        <h1 className="text-sm font-semibold tracking-wide">TERA Image Converter</h1>
      </header>

      {/* Body */}
      <main className="flex flex-col flex-1 gap-3 p-4 overflow-hidden max-w-4xl w-full mx-auto">

        <DropZone onFiles={addFiles} />

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
            onClick={pickFolder}
            disabled={busy}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            📁 {outDir ? outDir.name : 'Select Output Folder'}
          </button>

          <button
            onClick={handleProcess}
            disabled={busy || pendingItems.length === 0 || !outDir}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? 'Converting...' : '▶ Convert'}
          </button>
        </div>

        {/* Progress */}
        {progress && <ProgressBar done={progress.done} total={progress.total} />}

        <FileList items={items} />
      </main>
    </div>
  )
}
