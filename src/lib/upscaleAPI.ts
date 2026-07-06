// Super Resolution via DeepAI — CORS-enabled, synchronous response
const DEEPAI_URL = 'https://api.deepai.org/api/torch-srgan'

export async function upscaleViaAPI(
  src: HTMLCanvasElement,
  apiKey: string,
  onStatus?: (msg: string) => void,
): Promise<HTMLCanvasElement> {
  onStatus?.('Upscaling via DeepAI...')

  const blob = await new Promise<Blob>((resolve, reject) =>
    src.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.9),
  )

  const form = new FormData()
  form.append('image', blob, 'image.jpg')

  const res = await fetch(DEEPAI_URL, {
    method: 'POST',
    headers: { 'api-key': apiKey },
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).err ?? `DeepAI error ${res.status}`)
  }

  const data = await res.json()
  const outputUrl: string = data.output_url
  if (!outputUrl) throw new Error('No output URL from DeepAI')

  onStatus?.('Downloading result...')

  const imgRes = await fetch(outputUrl)
  const imgBlob = await imgRes.blob()
  const blobUrl = URL.createObjectURL(imgBlob)

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
