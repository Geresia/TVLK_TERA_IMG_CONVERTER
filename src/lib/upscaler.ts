// onnxruntime-web is loaded from CDN via index.html script tag
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

const MODEL_URL = 'https://huggingface.co/tidus2102/Real-ESRGAN/resolve/main/Real-ESRGAN_x2plus.onnx'
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

    const res = await fetch(MODEL_URL)
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

  console.log('[TERA Upscaler] inputNames:', session.inputNames)
  console.log('[TERA Upscaler] outputNames:', session.outputNames)
  console.log('[TERA Upscaler] image:', W, 'x', H)

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
      const padded = padToTile(tile)

      // Try NCHW first, fall back to NHWC on INVALID_ARGUMENT
      let result: Record<string, OrtTensor>
      try {
        console.log('[TERA Upscaler] trying NCHW [1,3,256,256]')
        result = await session.run({ [inputName]: toNCHW(padded) })
      } catch (e: any) {
        if (e?.message?.includes('ERROR_CODE: 2') || e?.message?.includes('INVALID_ARGUMENT')) {
          console.log('[TERA Upscaler] NCHW failed, trying NHWC [1,256,256,3]')
          result = await session.run({ [inputName]: toNHWC(padded) })
        } else {
          throw e
        }
      }

      outCtx.putImageData(
        cropRGBA(result[outputName], tw * SCALE, th * SCALE, TILE * SCALE),
        x * SCALE, y * SCALE,
      )
    }
  }

  return out
}

function padToTile(tile: ImageData): ImageData {
  if (tile.width === TILE && tile.height === TILE) return tile
  const padded = new ImageData(TILE, TILE)
  for (let row = 0; row < tile.height; row++) {
    padded.data.set(
      tile.data.subarray(row * tile.width * 4, (row + 1) * tile.width * 4),
      row * TILE * 4,
    )
  }
  return padded
}

function toNHWC({ data, width, height }: ImageData): OrtTensor {
  const n = width * height
  const f = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    f[i * 3]     = data[i * 4]     / 255
    f[i * 3 + 1] = data[i * 4 + 1] / 255
    f[i * 3 + 2] = data[i * 4 + 2] / 255
  }
  return new ort.Tensor('float32', f, [1, height, width, 3])
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

// Crop top-left outW×outH from a fullW-wide NCHW tensor
function cropRGBA(tensor: OrtTensor, outW: number, outH: number, fullW: number): ImageData {
  const src = tensor.data
  const fullH = TILE * SCALE
  const rgba = new Uint8ClampedArray(outW * outH * 4)
  for (let row = 0; row < outH; row++) {
    for (let col = 0; col < outW; col++) {
      const sp = row * fullW + col
      const dp = (row * outW + col) * 4
      rgba[dp]     = clamp(src[sp])
      rgba[dp + 1] = clamp(src[fullH * fullW + sp])
      rgba[dp + 2] = clamp(src[2 * fullH * fullW + sp])
      rgba[dp + 3] = 255
    }
  }
  return new ImageData(rgba, outW, outH)
}

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)))
