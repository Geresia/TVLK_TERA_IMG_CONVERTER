// ONNX inference runs in a Web Worker — main thread stays responsive during upscaling

type InMsg =
  | { type: 'progress'; pct: number }
  | { type: 'loaded' }
  | { type: 'tile'; done: number; total: number }
  | { type: 'upscaled'; rgba: ArrayBuffer; width: number; height: number }
  | { type: 'error'; message: string }

type PendingLoad = {
  resolve: () => void
  reject: (e: Error) => void
  progress?: (pct: number) => void
}

type PendingUpscale = {
  resolve: (c: HTMLCanvasElement) => void
  reject: (e: Error) => void
  onTile?: (done: number, total: number) => void
}

let worker: Worker | null = null
let workerReady = false
let loadPromise: Promise<void> | null = null
let pendingLoad: PendingLoad | null = null
let pendingUpscale: PendingUpscale | null = null

function ensureWorker(): Worker {
  if (worker) return worker

  const base = import.meta.env.BASE_URL ?? '/'
  worker = new Worker(`${base}upscaler.worker.js`)

  worker.addEventListener('message', (e: MessageEvent<InMsg>) => {
    const msg = e.data
    if (msg.type === 'progress') {
      pendingLoad?.progress?.(msg.pct)
    } else if (msg.type === 'loaded') {
      workerReady = true
      pendingLoad?.resolve()
      pendingLoad = null
    } else if (msg.type === 'tile') {
      pendingUpscale?.onTile?.(msg.done, msg.total)
    } else if (msg.type === 'upscaled') {
      const rgba = new Uint8ClampedArray(msg.rgba)
      const out = document.createElement('canvas')
      out.width = msg.width
      out.height = msg.height
      out.getContext('2d')!.putImageData(new ImageData(rgba, msg.width, msg.height), 0, 0)
      pendingUpscale?.resolve(out)
      pendingUpscale = null
    } else if (msg.type === 'error') {
      const err = new Error(msg.message)
      if (pendingLoad) {
        loadPromise = null   // allow retry
        pendingLoad.reject(err)
        pendingLoad = null
      }
      if (pendingUpscale) {
        pendingUpscale.reject(err)
        pendingUpscale = null
      }
    }
  })

  return worker
}

export function isModelLoaded() { return workerReady }

export function loadModel(onProgress?: (pct: number) => void): Promise<void> {
  if (workerReady) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    pendingLoad = { resolve, reject, progress: onProgress }
    ensureWorker().postMessage({ type: 'load' })
  })

  return loadPromise
}

export function upscaleCanvas(
  src: HTMLCanvasElement,
  onTile?: (done: number, total: number) => void,
): Promise<HTMLCanvasElement> {
  if (!workerReady) return Promise.reject(new Error('Model not loaded'))

  const { width: W, height: H } = src
  const imgData = src.getContext('2d')!.getImageData(0, 0, W, H)

  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    pendingUpscale = { resolve, reject, onTile }
    ensureWorker().postMessage(
      { type: 'upscale', rgba: imgData.data.buffer, width: W, height: H },
      [imgData.data.buffer],
    )
  })
}
