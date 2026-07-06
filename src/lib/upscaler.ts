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

// SwinIR-M x4 GAN — browser-verified ONNX, dynamic input size, NCHW float32
const MODEL_URL = 'https://huggingface.co/rocca/swin-ir-onnx/resolve/main/003_realSR_BSRGAN_DFO_s64w8_SwinIR-M_x4_GAN.onnx'
const TILE = 256

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
  const outCtx = out.getContext('2d')!
  let scaleX = 4, scaleY = 4

  const [inputName] = session.inputNames
  const [outputName] = session.outputNames

  for (let y = 0; y < H; y += TILE) {
    for (let x = 0; x < W; x += TILE) {
      const tw = Math.min(TILE, W - x)
      const th = Math.min(TILE, H - y)
      const tile = srcCtx.getImageData(x, y, tw, th)

      // Dynamic axes: send tile as-is (no padding needed)
      const result = await session.run({ [inputName]: toNCHW(tile) })

      const outTensor = result[outputName] as any
      const dims: number[] = outTensor.dims // [1, 3, H_out, W_out]
      const outH = dims[2], outW = dims[3]

      if (out.width === 0) {
        scaleX = outW / tw
        scaleY = outH / th
        out.width = Math.round(W * scaleX)
        out.height = Math.round(H * scaleY)
        console.log('[TERA Upscaler] scale:', scaleX, 'x', scaleY, '→', out.width, 'x', out.height)
      }

      outCtx.putImageData(
        toRGBA(result[outputName], outW, outH),
        Math.round(x * scaleX), Math.round(y * scaleY),
      )
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
