// Real-ESRGAN via Replicate API — runs on GPU server, fast
const REPLICATE_API = 'https://api.replicate.com/v1/predictions'
// nightmareai/real-esrgan x4
const MODEL_VERSION = '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b'

export async function upscaleViaAPI(
  src: HTMLCanvasElement,
  apiKey: string,
  onStatus?: (msg: string) => void,
): Promise<HTMLCanvasElement> {
  const dataUri = src.toDataURL('image/jpeg', 0.9)

  onStatus?.('Sending to Replicate...')

  const createRes = await fetch(REPLICATE_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: MODEL_VERSION,
      input: { image: dataUri, scale: 4, face_enhance: false },
    }),
  })

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}))
    throw new Error((err as any).detail ?? `Replicate error ${createRes.status}`)
  }

  let prediction = await createRes.json()

  while (
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed' &&
    prediction.status !== 'canceled'
  ) {
    await new Promise(r => setTimeout(r, 1500))
    const pollRes = await fetch(`${REPLICATE_API}/${prediction.id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    prediction = await pollRes.json()
    onStatus?.(`AI upscaling... (${prediction.status})`)
  }

  if (prediction.status !== 'succeeded') {
    throw new Error((prediction as any).error ?? 'Replicate prediction failed')
  }

  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
  const imgRes = await fetch(outputUrl)
  const blob = await imgRes.blob()
  const blobUrl = URL.createObjectURL(blob)

  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load upscaled image'))
    img.src = blobUrl
  })

  const out = document.createElement('canvas')
  out.width = img.naturalWidth
  out.height = img.naturalHeight
  out.getContext('2d')!.drawImage(img, 0, 0)
  URL.revokeObjectURL(blobUrl)

  return out
}
