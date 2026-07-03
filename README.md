# TERA Image Converter

Automatically crops and resizes images to match TERA's specifications.

**→ [https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/)**

![Preview](docs/preview.svg)

---

## Features

- **Drag & drop** or click to add images
- **Paste image URL** to fetch and add directly
- **Auto center-crop** to the nearest TERA-compliant ratio (`1:1` / `3:2` / `16:9`)
- **Before / After preview** — click any converted file to compare original vs result
- **2x Upscale** — AI upscaling via waifu2x ONNX (model file required, loaded on demand)
- **Save** — downloads directly to your Downloads folder
- **Save As** — choose any output folder
- Batch processing support
- JPEG 0.92 quality output

## TERA Spec

| | Min | Max |
|---|---|---|
| Width | 1281 px | 4096 px |
| Height | 600 px | 4096 px |
| Ratio | 1:1 / 3:2 / 16:9 | — |
| Format | JPEG 0.92 | — |

## Usage

1. Open the [app](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/) in **Chrome or Edge**
2. Drag & drop images, or paste a URL into the input field
3. Click **Save** (auto Downloads) or **Save As** (choose folder)
4. Click any converted file to preview before vs after

> Safari / Firefox do not support the File System Access API required for saving files.

## 2x Upscale (Optional)

Place a waifu2x-compatible ONNX model at `public/models/waifu2x.onnx`, then click **✦ 2x Upscale** to enable. The model loads on first use (~50–100 MB depending on model).

## Supported Formats

`JPG` · `PNG` · `WEBP` · `BMP` · `GIF`

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v4
- Canvas API (image processing)
- ONNX Runtime Web via CDN (upscaling)
- File System Access API (file saving)
- GitHub Pages via `gh-pages` branch
