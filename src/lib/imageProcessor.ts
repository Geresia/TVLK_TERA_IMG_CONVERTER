import { upscaleCanvas } from './upscaler'

const RATIOS = [1, 1.5, 1.7778] as const

export interface ProcessResult {
  width: number
  height: number
  ratio: '1:1' | '3:2' | '16:9'
  blob: Blob
  baseName: string
}

export async function processImage(file: File, enhance = false): Promise<ProcessResult> {
  const url = URL.createObjectURL(file)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load ${file.name}`))
    img.src = url
  })
  URL.revokeObjectURL(url)

  const sw = img.naturalWidth
  const sh = img.naturalHeight
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

  // Source for final draw: original image or AI-upscaled crop
  let sourceEl: HTMLCanvasElement | HTMLImageElement = img
  let srcX = sx, srcY = sy, srcW = cropW, srcH = cropH

  if (enhance) {
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = cropW
    cropCanvas.height = cropH
    cropCanvas.getContext('2d')!.drawImage(img, sx, sy, cropW, cropH, 0, 0, cropW, cropH)

    // Cap input to upscaler: model is 4x, so 512px → 2048px output (covers all TERA sizes)
    // Prevents OOM on large source images
    const MAX_IN = 512
    let upscaleInput = cropCanvas
    if (cropW > MAX_IN || cropH > MAX_IN) {
      const s = Math.min(MAX_IN / cropW, MAX_IN / cropH)
      const pre = document.createElement('canvas')
      pre.width = Math.round(cropW * s)
      pre.height = Math.round(cropH * s)
      pre.getContext('2d')!.drawImage(cropCanvas, 0, 0, pre.width, pre.height)
      upscaleInput = pre
    }

    const upscaled = await upscaleCanvas(upscaleInput)
    sourceEl = upscaled
    srcX = 0; srcY = 0; srcW = upscaled.width; srcH = upscaled.height
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
  ctx.drawImage(sourceEl, srcX, srcY, srcW, srcH, 0, 0, cw, ch)

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
