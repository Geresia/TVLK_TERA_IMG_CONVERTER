export default function ProgressBar({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 shrink-0 w-12 text-right">{done} / {total}</span>
    </div>
  )
}
