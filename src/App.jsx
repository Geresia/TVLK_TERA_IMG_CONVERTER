import { useState, useRef, useCallback } from 'react'
import './App.css'

const EXTS = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif']

async function processImage(file, outDirHandle) {
  const url = URL.createObjectURL(file)
  const img = new Image()
  await new Promise((ok, err) => { img.onload = ok; img.onerror = err; img.src = url })
  URL.revokeObjectURL(url)

  const sw = img.naturalWidth, sh = img.naturalHeight

  // 가장 가까운 허용 비율 (1:1 / 3:2 / 16:9)
  const RATIOS = [1, 1.5, 1.7778]
  const curRatio = sw / sh
  const tgtRatio = RATIOS.reduce((a, b) => Math.abs(b - curRatio) < Math.abs(a - curRatio) ? b : a)

  // center-crop
  let sx = 0, sy = 0, cropW = sw, cropH = sh
  if (curRatio > tgtRatio) { cropW = Math.round(sh * tgtRatio); sx = Math.round((sw - cropW) / 2) }
  else if (curRatio < tgtRatio) { cropH = Math.round(sw / tgtRatio); sy = Math.round((sh - cropH) / 2) }

  // 크기 조정
  let cw = cropW, ch = cropH
  const MIN_W = 800, MIN_H = 600, MAX_W = 4096, MAX_H = 4096
  if (cw > MAX_W || ch > MAX_H) { const s = Math.min(MAX_W / cw, MAX_H / ch); cw = Math.round(cw * s); ch = Math.round(ch * s) }
  if (cw < MIN_W || ch < MIN_H) { const s = Math.max(MIN_W / cw, MIN_H / ch); cw = Math.round(cw * s); ch = Math.round(ch * s) }
  // Tera: width ≤ 1280 거부 → 강제 업스케일
  if (cw <= 1280) { const s = 1281 / cw; cw = 1281; ch = Math.round(ch * s) }

  const canvas = document.createElement('canvas')
  canvas.width = cw; canvas.height = ch
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, cw, ch)

  const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92))

  const baseName = file.name.replace(/\.[^.]+$/, '')
  const fileHandle = await outDirHandle.getFileHandle(baseName + '.jpg', { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()

  const ratioLabel = tgtRatio === 1 ? '1:1' : tgtRatio === 1.5 ? '3:2' : '16:9'
  return `${cw}×${ch} (${ratioLabel})`
}

function fmtSize(b) {
  return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1024).toFixed(0) + ' KB'
}

const STATUS_ICON = { pending: '🖼️', processing: '⏳', ok: '✅', err: '❌' }

export default function App() {
  const [files, setFiles] = useState([])   // { id, file, name, size, status, meta }
  const [outDir, setOutDir] = useState(null)
  const [progress, setProgress] = useState(null)  // { done, total } | null
  const [isDragging, setIsDragging] = useState(false)
  const processingRef = useRef(false)

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      return EXTS.includes(ext)
    })
    setFiles(prev => {
      const existingKeys = new Set(prev.map(f => f.name + f.size))
      const newItems = incoming
        .filter(f => !existingKeys.has(f.name + f.size))
        .map(f => ({ id: crypto.randomUUID(), file: f, name: f.name, size: f.size, status: 'pending', meta: '' }))
      return [...prev, ...newItems]
    })
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleClick = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'; input.multiple = true; input.accept = 'image/*'
    input.onchange = () => addFiles(input.files)
    input.click()
  }, [addFiles])

  const pickFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      setOutDir(handle)
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e)
    }
  }

  const handleProcess = async () => {
    if (!outDir || processingRef.current) return
    processingRef.current = true

    const targets = files.filter(f => f.status === 'pending')
    let done = 0
    setProgress({ done: 0, total: targets.length })

    for (const item of targets) {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f))
      try {
        const meta = await processImage(item.file, outDir)
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'ok', meta } : f))
      } catch (e) {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'err', meta: e.message?.slice(0, 40) || '오류' } : f))
      }
      done++
      setProgress({ done, total: targets.length })
    }

    processingRef.current = false
    setProgress(null)
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const isProcessing = processingRef.current

  return (
    <div className="layout">
      <header className="header">
        <h1>🖼️ TERA Image Converter</h1>
        <div className="spec">
          비율: 1:1 / 3:2 / 16:9 center-crop &nbsp;·&nbsp;
          크기: 800×600 ~ 4096×4096 &nbsp;·&nbsp;
          JPEG 0.92 · width &gt; 1280
        </div>
      </header>

      <div className="main">
        {/* Drop zone */}
        <div
          className={`dropzone${isDragging ? ' dragover' : ''}`}
          onClick={handleClick}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="drop-icon">📂</div>
          <p><strong>클릭</strong>하거나 이미지를 <strong>드래그</strong>하세요</p>
          <p className="drop-sub">JPG · PNG · WEBP · BMP · GIF · 여러 장 한 번에 가능</p>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <span className="toolbar-info">
            {files.length === 0
              ? '파일을 추가하세요'
              : `${files.length}개 파일 · 대기 ${pendingCount}개`}
          </span>
          <button className="btn btn-ghost" onClick={() => setFiles([])} disabled={isProcessing}>초기화</button>
          <button className="btn btn-secondary" onClick={pickFolder} disabled={isProcessing}>
            📁 출력 폴더 {outDir ? `(${outDir.name})` : '선택'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleProcess}
            disabled={pendingCount === 0 || !outDir || isProcessing}
          >
            {isProcessing ? '변환 중...' : '▶ 변환 시작'}
          </button>
        </div>

        {/* Progress */}
        {progress && (
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <span className="progress-label">{progress.done} / {progress.total}</span>
          </div>
        )}

        {/* File list */}
        <div className="file-list">
          {files.length === 0 ? (
            <div className="empty-msg">이미지를 드래그하거나 클릭해서 추가하세요</div>
          ) : (
            files.map(f => (
              <div key={f.id} className="file-item">
                <span className="file-icon">{STATUS_ICON[f.status]}</span>
                <span className="file-name" title={f.name}>{f.name}</span>
                <span className="file-size">{fmtSize(f.size)}</span>
                <span className={`file-status status-${f.status}`}>
                  {f.status === 'ok' ? f.meta
                    : f.status === 'err' ? f.meta
                    : f.status === 'processing' ? '처리 중...'
                    : '대기'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
