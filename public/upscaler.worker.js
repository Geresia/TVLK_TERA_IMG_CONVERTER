'use strict'

importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js')

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/'

// realesr-general-x4v3: 4.87MB CNN-based (12x smaller than SwinIR, no attention)
const MODEL_URL = 'https://huggingface.co/Heliosoph/realesrgan-onnx/resolve/main/realesr-general-x4v3.onnx'
const TILE = 128

let session = null

async function loadModel() {
  const res = await fetch(MODEL_URL)
  if (!res.ok) throw new Error(`Model fetch failed (${res.status})`)

  const total = +(res.headers.get('content-length') ?? 0)
  const reader = res.body.getReader()
  const chunks = []
  let received = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    if (total > 0) self.postMessage({ type: 'progress', pct: received / total })
  }

  const buf = new Uint8Array(received)
  let off = 0
  for (const c of chunks) { buf.set(c, off); off += c.length }

  // Try WebGPU first (GPU = 10-50x faster), fall back to WASM
  session = await ort.InferenceSession.create(buf.buffer, {
    executionProviders: ['webgpu', 'wasm'],
  })
  self.postMessage({ type: 'loaded' })
}

function toNCHW(rgba, width, height) {
  const n = width * height
  const f = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) {
    f[i]       = rgba[i * 4]     / 255
    f[n + i]   = rgba[i * 4 + 1] / 255
    f[n*2 + i] = rgba[i * 4 + 2] / 255
  }
  return new ort.Tensor('float32', f, [1, 3, height, width])
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v * 255))) }

async function upscaleImage(srcBuf, srcW, srcH) {
  const srcRgba = new Uint8ClampedArray(srcBuf)
  const inputName  = session.inputNames[0]
  const outputName = session.outputNames[0]

  let scaleX = 4, scaleY = 4
  let outW = 0, outH = 0
  let outRgba = null

  const totalTiles = Math.ceil(srcH / TILE) * Math.ceil(srcW / TILE)
  let tilesDone = 0

  for (let y = 0; y < srcH; y += TILE) {
    for (let x = 0; x < srcW; x += TILE) {
      const tw = Math.min(TILE, srcW - x)
      const th = Math.min(TILE, srcH - y)

      // Extract tile rows
      const tileRgba = new Uint8ClampedArray(tw * th * 4)
      for (let ty = 0; ty < th; ty++) {
        const srcOff = ((y + ty) * srcW + x) * 4
        tileRgba.set(srcRgba.subarray(srcOff, srcOff + tw * 4), ty * tw * 4)
      }

      const result = await session.run({ [inputName]: toNCHW(tileRgba, tw, th) })
      const outTensor = result[outputName]
      const dims = outTensor.dims       // [1, 3, tOutH, tOutW]
      const tOutH = dims[2], tOutW = dims[3]

      if (outW === 0) {
        scaleX = tOutW / tw
        scaleY = tOutH / th
        outW = Math.round(srcW * scaleX)
        outH = Math.round(srcH * scaleY)
        outRgba = new Uint8ClampedArray(outW * outH * 4)
      }

      const src = outTensor.data
      const n = tOutW * tOutH
      const dstX = Math.round(x * scaleX)
      const dstY = Math.round(y * scaleY)

      for (let ty = 0; ty < tOutH; ty++) {
        for (let tx = 0; tx < tOutW; tx++) {
          const si = ty * tOutW + tx
          const di = ((dstY + ty) * outW + (dstX + tx)) * 4
          outRgba[di]   = clamp(src[si])
          outRgba[di+1] = clamp(src[n   + si])
          outRgba[di+2] = clamp(src[n*2 + si])
          outRgba[di+3] = 255
        }
      }

      tilesDone++
      self.postMessage({ type: 'tile', done: tilesDone, total: totalTiles })
    }
  }

  return { rgba: outRgba.buffer, width: outW, height: outH }
}

self.onmessage = async (e) => {
  try {
    const { type } = e.data
    if (type === 'load') {
      await loadModel()
    } else if (type === 'upscale') {
      const result = await upscaleImage(e.data.rgba, e.data.width, e.data.height)
      self.postMessage({ type: 'upscaled', ...result }, [result.rgba])
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err?.message ?? String(err) })
  }
}
