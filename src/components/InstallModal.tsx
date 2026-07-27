import { useEffect } from 'react'

interface Props {
  onClose: () => void
}

const ZIP_URL = 'https://github.com/Geresia/tera_assistant/archive/refs/heads/main.zip'

export default function InstallModal({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <p className="text-sm font-semibold text-slate-700">Install Tera Assistant</p>
          <button
            onClick={onClose}
            className="shrink-0 text-slate-400 hover:text-slate-700 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 p-5 overflow-auto">
          <a
            href={ZIP_URL}
            className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Download tera_assistant.zip
          </a>

          <ol className="flex flex-col gap-3 text-sm text-slate-600">
            <li className="flex gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-semibold flex items-center justify-center">1</span>
              <span>Unzip the downloaded file (e.g. to your Desktop).</span>
            </li>
            <li className="flex gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-semibold flex items-center justify-center">2</span>
              <span>
                Go to <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">chrome://extensions</code> and enable <strong>Developer mode</strong> (top right).
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-semibold flex items-center justify-center">3</span>
              <span>
                Click <strong>Load unpacked</strong> and select the unzipped <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">tera_assistant-main</code> folder.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-semibold flex items-center justify-center">4</span>
              <span>Contact SangJae Lee for access to the Google Sheet.</span>
            </li>
          </ol>

          <p className="text-xs text-slate-400">
            To update later, double-click <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-500">Tera_Update.bat</code> inside the extension folder.
          </p>
        </div>
      </div>
    </div>
  )
}
