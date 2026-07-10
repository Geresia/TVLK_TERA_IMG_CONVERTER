import { useState, useRef, useEffect } from 'react'
import type { FileItem as FileItemType } from '../hooks/useFileQueue'

const STATUS = {
  pending:    { icon: '🖼️', color: 'text-slate-400', label: 'Pending' },
  processing: { icon: '⏳', color: 'text-blue-500',  label: 'Processing...' },
  ok:         { icon: '✅', color: 'text-emerald-500', label: null },
  err:        { icon: '❌', color: 'text-red-500',    label: null },
} as const

function fmtSize(b: number): string {
  return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1024).toFixed(0) + ' KB'
}

function FileItem({
  item,
  onPreview,
  onRename,
  onToggleFit,
}: {
  item: FileItemType
  onPreview: (item: FileItemType) => void
  onRename: (id: string, name: string) => void
  onToggleFit: (id: string) => void
}) {
  const s = STATUS[item.status]
  const label = s.label
    ?? (item.status === 'ok' && item.result
      ? `${item.result.width}×${item.result.height} (${item.result.ratio})`
      : item.error)

  const [editing, setEditing] = useState(false)
  const displayName = item.name.replace(/\.[^.]+$/, '')
  const ext = item.name.slice(item.name.lastIndexOf('.'))
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraft(item.customName ?? displayName)
    setEditing(true)
  }

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== displayName) onRename(item.id, trimmed)
    else if (!trimmed) onRename(item.id, displayName)
    setEditing(false)
  }

  const clickable = item.status === 'ok' && !editing
  const shownName = (item.customName ?? displayName) + ext

  return (
    <div
      onClick={() => clickable && onPreview(item)}
      className={`flex items-center gap-3 px-4 py-2 border-b border-slate-100 last:border-0 text-sm
        ${clickable ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
    >
      <span className="text-base shrink-0">{s.icon}</span>

      {editing ? (
        <div className="flex-1 flex items-center gap-1 min-w-0">
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') setEditing(false)
            }}
            onClick={e => e.stopPropagation()}
            className="flex-1 min-w-0 px-1.5 py-0.5 text-xs rounded border border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700"
          />
          <span className="text-xs text-slate-400 shrink-0">{ext}</span>
        </div>
      ) : (
        <span
          className="flex-1 truncate text-slate-700 cursor-text"
          title={shownName + ' (double-click to rename)'}
          onDoubleClick={startEdit}
        >
          {shownName}
          {item.customName && (
            <span className="ml-1.5 text-xs text-blue-400">renamed</span>
          )}
        </span>
      )}

      <div className="shrink-0 flex rounded overflow-hidden border border-slate-200 text-xs font-medium">
        <button
          onClick={e => { e.stopPropagation(); if (item.fitMode) onToggleFit(item.id) }}
          className={`px-2 py-0.5 transition-colors ${!item.fitMode ? 'bg-blue-500 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
        >Crop</button>
        <button
          onClick={e => { e.stopPropagation(); if (!item.fitMode) onToggleFit(item.id) }}
          className={`px-2 py-0.5 transition-colors ${item.fitMode ? 'bg-blue-500 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
        >Fit</button>
      </div>
      <span className="shrink-0 text-xs text-slate-400 w-14 text-right">{fmtSize(item.size)}</span>
      <span className={`shrink-0 text-xs font-medium w-36 text-right ${s.color}`}>{label}</span>
    </div>
  )
}

export default function FileList({
  items,
  onPreview,
  onRename,
  onToggleFit,
}: {
  items: FileItemType[]
  onPreview: (item: FileItemType) => void
  onRename: (id: string, name: string) => void
  onToggleFit: (id: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-400 bg-white rounded-xl border border-slate-200">
        Drag or click to add images
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200">
      {items.map(item => (
        <FileItem key={item.id} item={item} onPreview={onPreview} onRename={onRename} onToggleFit={onToggleFit} />
      ))}
    </div>
  )
}
