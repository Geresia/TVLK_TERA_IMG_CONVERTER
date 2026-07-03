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

function FileItem({ item, onPreview }: { item: FileItemType; onPreview: (item: FileItemType) => void }) {
  const s = STATUS[item.status]
  const label = s.label
    ?? (item.status === 'ok' && item.result
      ? `${item.result.width}×${item.result.height} (${item.result.ratio})`
      : item.error)

  const clickable = item.status === 'ok'

  return (
    <div
      onClick={() => clickable && onPreview(item)}
      className={`flex items-center gap-3 px-4 py-2 border-b border-slate-100 last:border-0 text-sm
        ${clickable ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
    >
      <span className="text-base shrink-0">{s.icon}</span>
      <span className="flex-1 truncate text-slate-700" title={item.name}>{item.name}</span>
      <span className="shrink-0 text-xs text-slate-400 w-14 text-right">{fmtSize(item.size)}</span>
      <span className={`shrink-0 text-xs font-medium w-36 text-right ${s.color}`}>{label}</span>
    </div>
  )
}

export default function FileList({ items, onPreview }: { items: FileItemType[]; onPreview: (item: FileItemType) => void }) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-400 bg-white rounded-xl border border-slate-200">
        Drag or click to add images
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200">
      {items.map(item => <FileItem key={item.id} item={item} onPreview={onPreview} />)}
    </div>
  )
}
