import { useEffect, useState } from 'react'
import type { FileItem } from '../hooks/useFileQueue'

interface Props {
  item: FileItem
  onClose: () => void
}

export default function PreviewModal({ item, onClose }: Props) {
  const [originalUrl, setOriginalUrl] = useState('')
  const [resultUrl, setResultUrl] = useState('')

  useEffect(() => {
    const orig = URL.createObjectURL(item.file)
    const res = item.result?.blob ? URL.createObjectURL(item.result.blob) : ''
    setOriginalUrl(orig)
    setResultUrl(res)
    return () => {
      URL.revokeObjectURL(orig)
      if (res) URL.revokeObjectURL(res)
    }
  }, [item])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const origSize = item.size > 1048576
    ? (item.size / 1048576).toFixed(1) + ' MB'
    : (item.size / 1024).toFixed(0) + ' KB'

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <p className="text-sm font-semibold text-slate-700 truncate pr-4">{item.name}</p>
          <button
            onClick={onClose}
            className="shrink-0 text-slate-400 hover:text-slate-700 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-2 gap-4 p-5 overflow-auto">
          {/* Original */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Original</p>
            <div className="bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center min-h-40">
              {originalUrl && (
                <img src={originalUrl} alt="original" className="max-w-full max-h-64 object-contain" />
              )}
            </div>
            <p className="text-xs text-slate-400">{origSize}</p>
          </div>

          {/* Converted */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Converted</p>
            <div className="bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center min-h-40">
              {resultUrl && (
                <img src={resultUrl} alt="converted" className="max-w-full max-h-64 object-contain" />
              )}
            </div>
            {item.result && (
              <p className="text-xs text-slate-400">
                {item.result.width}×{item.result.height} · {item.result.ratio}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
