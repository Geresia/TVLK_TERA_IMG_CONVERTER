import { upscaleCanvas } from './upscaler'

const RATIOS = [1, 1.5, 1.7778] as const

export interface ProcessResult {
  width: number
  height: number
  ratio: '1:1' | '3:2' | '16:9'
  blob: Blob
  baseName: string
}

export async function processImage(file: File, upscale = false): Promise<ProcessResult> {
  const url = URL.createObjectURL(file)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load ${file.name}`))
    img.src = url
  })
  URL.revokeObjectURL(url)

  let sw = img.naturalWidth
  let sh = img.naturalHeight

  // Draw source to canvas, upscale if requested
  let sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = sw
  sourceCanvas.height = sh
  sourceCanvas.getContext('2d')!.drawImage(img, 0, 0)

  if (upscale) {
    sourceCanvas = await upscaleCanvas(sourceCanvas)
    sw = sourceCanvas.width
    sh = sourceCanvas.height
  }
  const curRatio = sw / sh

  const tgtRatio = RATIOS.reduce((a, b) =>
    Math.abs(b - curRatio) < Math.abs(a - curRatio) ? b : a,
  )

  let sx = 0, sy = 0, cropW = sw, cropH = sh
  if (curRatio > tgtRatio) {
    cropW = Math.round(sh * tgtRatio)
    sx = Math.round((sw - cropW) / 2)
  } else if (curRatio < tgtRatio) {
    cropH = Math.round(sw / tgtRatio)
    sy = Math.round((sh - cropH) / 2)
  }

  let cw = cropW
  let ch = cropH
  const MIN_W = 800, MIN_H = 600, MAX_W = 4096, MAX_H = 4096

  if (cw > MAX_W || ch > MAX_H) {
    const s = Math.min(MAX_W / cw, MAX_H / ch)
    cw = Math.round(cw * s); ch = Math.round(ch * s)
  }
  if (cw < MIN_W || ch < MIN_H) {
    const s = Math.max(MIN_W / cw, MIN_H / ch)
    cw = Math.round(cw * s); ch = Math.round(ch * s)
  }
  if (cw <= 1280) {
    const s = 1281 / cw
    cw = 1281; ch = Math.round(ch * s)
  }

  const canvas = document.createElement('canvas')
  canvas.width = cw; canvas.height = ch
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(sourceCanvas, sx, sy, cropW, cropH, 0, 0, cw, ch)

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.92),
  )

  const baseName = file.name.replace(/\.[^.]+$/, '')
  const ratio = tgtRatio === 1 ? '1:1' : tgtRatio === 1.5 ? '3:2' : '16:9'
  return { width: cw, height: ch, ratio, blob, baseName }
}

export async function saveToDir(blob: Blob, fileName: string, dirHandle: FileSystemDirectoryHandle) {
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

export function downloadBlob(blob: Blob, fileName: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fileName
  a.click()
  URL.revokeObjectURL(a.href)
}
