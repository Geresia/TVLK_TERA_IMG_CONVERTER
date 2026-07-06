# TERA Image Converter

Automatically crops and resizes images to match TERA's specifications.

**→ [https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/)**

![Preview](docs/preview.svg)

---

## Features

- **Drag & drop** or click to add images
- **Paste image URL** to fetch and add directly
- **Auto center-crop** to the nearest TERA-compliant ratio (`1:1` / `3:2` / `16:9`)
- **Before / After preview** - click any converted file to compare original vs result
- **2x Upscale** - canvas sharpening toggle (Unsharp Mask, instant, no model downloads)
- **Save** - downloads directly to your Downloads folder
- **Save As** - choose any output folder
- Batch processing support
- JPEG 0.92 quality output

## TERA Spec

| | Min | Max |
|---|---|---|
| Width | 1281 px | 4096 px |
| Height | 600 px | 4096 px |
| Ratio | 1:1 / 3:2 / 16:9 | - |
| Format | JPEG 0.92 | - |

## Usage

1. Open the [app](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/) in **Chrome or Edge**
2. Drag & drop images, or paste a URL into the input field
3. Toggle **2x Upscale** for sharpening (optional)
4. Click **Save** (auto Downloads) or **Save As** (choose folder)
5. Click any converted file to preview before vs after

> Safari / Firefox do not support the File System Access API required for saving files.

## 2x Upscale

Canvas-based Unsharp Mask sharpening — works entirely in the browser with no model downloads or external API calls. Applies two passes of USM (`blur(3px)` radius) for visible edge enhancement.

## Supported Formats

`JPG` · `PNG` · `WEBP` · `BMP` · `GIF`

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v4
- Canvas API (image processing + sharpening)
- File System Access API (file saving)
- GitHub Pages via `gh-pages` branch
