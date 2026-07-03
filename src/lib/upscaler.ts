// onnxruntime-web is loaded from CDN via index.html script tag
// window._ortReady resolves with the ort global once loaded
declare const ort: {
  InferenceSession: {
    create(buffer: ArrayBuffer, options: { executionProviders: string[] }): Promise<{
      inputNames: string[]
      outputNames: string[]
      run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>>
    }>
  }
  Tensor: new (type: string, data: Float32Array, shape: number[]) => OrtTensor
}

interface OrtTensor {
  data: Float32Array
}

declare global {
  interface Window { _ortReady: Promise<typeof ort> }
}

const MODEL_PATH = `${import.meta.env.BASE_URL}models/waifu2x.onnx`
const TILE = 256
const SCALE = 2

let session: Awaited<ReturnType<typeof ort.InferenceSession.create>> | null = null
let loadPromise: Promise<void> | null = null

export function isModelLoaded() {
  return session !== null
}

export async function loadModel(onProgress?: (pct: number) => void): Promise<void> {
  if (session) return
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    await window._ortReady

    const res = await fetch(MODEL_PATH)
    if (!res.ok) throw new Error(`Failed to fetch model (${res.status})`)

    const total = +(res.headers.get('content-length') ?? 0)
    const reader = res.body!.getReader()
    const chunks: Uint8Array[] = []
    let received = 0

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.length
      if (total > 0) onProgress?.(received / total)
    }

    const buf = new Uint8Array(received)
    let off = 0
    for (const c of chunks) { buf.set(c, off); off += c.length }

    session = await ort.InferenceSession.create(buf.buffer, {
      executionProviders: ['wasm'],
    })
    onProgress?.(1)
  })()

  return loadPromise
}

export async function upscaleCanvas(src: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  if (!session) throw new Error('Model not loaded')

  const { width: W, height: H } = src
  const srcCtx = src.getContext('2d')!

  const out = document.createElement('canvas')
  out.width = W * SCALE
  out.height = H * SCALE
  const outCtx = out.getContext('2d')!

  const [inputName] = session.inputNames
  const [outputName] = session.outputNames

  for (let y = 0; y < H; y += TILE) {
    for (let x = 0; x < W; x += TILE) {
      const tw = Math.min(TILE, W - x)
      const th = Math.min(TILE, H - y)
      const tile = srcCtx.getImageData(x, y, tw, th)
      const result = await session.run({ [inputName]: toNCHW(tile) })
      outCtx.putImageData(toRGBA(result[outputName], tw * SCALE, th * SCALE), x * SCALE, y * SCALE)
    }
  }

  return out
}

function toNCHW({ data, width, height }: ImageData): OrtTensor {
  const n = width * height
  const f = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) {
    f[i]         = data[i * 4]     / 255
    f[n + i]     = data[i * 4 + 1] / 255
    f[n * 2 + i] = data[i * 4 + 2] / 255
  }
  return new ort.Tensor('float32', f, [1, 3, height, width])
}

function toRGBA(tensor: OrtTensor, width: number, height: number): ImageData {
  const src = tensor.data
  const n = width * height
  const rgba = new Uint8ClampedArray(n * 4)
  for (let i = 0; i < n; i++) {
    rgba[i * 4]     = clamp(src[i])
    rgba[i * 4 + 1] = clamp(src[n + i])
    rgba[i * 4 + 2] = clamp(src[n * 2 + i])
    rgba[i * 4 + 3] = 255
  }
  return new ImageData(rgba, width, height)
}

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)))
