const RATIOS = [1, 1.5, 1.7778] as const

export interface ProcessResult {
  width: number
  height: number
  ratio: '1:1' | '3:2' | '16:9'
  blob: Blob
  baseName: string
}

function sharpen(canvas: HTMLCanvasElement, amount: number): void {
  const { width: W, height: H } = canvas
  const ctx = canvas.getContext('2d')!

  const original = ctx.getImageData(0, 0, W, H)

  // Blurred copy for USM: sharp = original + amount * (original - blurred)
  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = W; blurCanvas.height = H
  const bCtx = blurCanvas.getContext('2d')!
  bCtx.filter = 'blur(3px)'
  bCtx.drawImage(canvas, 0, 0)
  const blurred = bCtx.getImageData(0, 0, W, H)

  const out = new Uint8ClampedArray(original.data.length)
  for (let i = 0; i < original.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      out[i + c] = Math.max(0, Math.min(255,
        Math.round(original.data[i + c] + amount * (original.data[i + c] - blurred.data[i + c]))
      ))
    }
    out[i + 3] = 255
  }

  ctx.putImageData(new ImageData(out, W, H), 0, 0)
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
  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, cw, ch)

  if (enhance) {
    sharpen(canvas, 3.0)  // broad edges
    sharpen(canvas, 2.0)  // fine detail
  }

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
