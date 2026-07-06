// High-quality 2x upscale via canvas — no model file required
export function isModelLoaded() {
  return true
}

export async function loadModel(_onProgress?: (pct: number) => void): Promise<void> {
  // no-op: canvas upscale is always ready
}

export async function upscaleCanvas(src: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const out = document.createElement('canvas')
  out.width = src.width * 2
  out.height = src.height * 2
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, out.width, out.height)
  return out
}
