import { useState, useCallback } from 'react'

interface Props {
  onFiles: (files: FileList | null) => void
}

export default function DropZone({ onFiles }: Props) {
  const [dragging, setDragging] = useState(false)

  const openPicker = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*'
    input.onchange = () => onFiles(input.files)
    input.click()
  }, [onFiles])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    onFiles(e.dataTransfer.files)
  }, [onFiles])

  return (
    <div
      onClick={openPicker}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        flex flex-col items-center justify-center gap-2 py-10 px-6
        rounded-xl border-2 border-dashed cursor-pointer select-none
        transition-colors duration-150
        ${dragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
        }
      `}
    >
      <span className="text-4xl">📂</span>
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-blue-500">클릭</span>하거나 이미지를{' '}
        <span className="font-semibold text-blue-500">드래그</span>하세요
      </p>
      <p className="text-xs text-slate-400">JPG · PNG · WEBP · BMP · GIF · 여러 장 한 번에 가능</p>
    </div>
  )
}
