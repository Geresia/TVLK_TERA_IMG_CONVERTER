<div align="center">

# TERA Image Converter

**Automatically crop & resize hotel images to Traveloka TERA specifications - in seconds.**

[![Live App](https://img.shields.io/badge/▶%20Launch%20App-0EA5E9?style=for-the-badge&logoColor=white)](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/)
[![Visitors](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FGeresia%2FTVLK_TERA_IMG_CONVERTER%2Fmain%2Fdocs%2Fga4-stats.json&query=%24.total_users&label=visitors&style=for-the-badge&color=0ea5e9&labelColor=334155)](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/)
[![Last Commit](https://img.shields.io/github/last-commit/Geresia/TVLK_TERA_IMG_CONVERTER?style=for-the-badge&color=334155)](https://github.com/Geresia/TVLK_TERA_IMG_CONVERTER/commits/main)

![Preview](docs/preview.svg)

</div>


## Overview

TERA Image Converter is a browser-based tool that takes any hotel photo and automatically:

- Center-crops it to the closest TERA-compliant aspect ratio
- Upscales it to meet the minimum 1281px width requirement
- Optionally sharpens it with a two-pass Unsharp Mask filter
- Outputs a JPEG at 0.92 quality - ready to upload

No server. No installs. Runs entirely in your browser.


## Features

| Feature | Description |
|---------|-------------|
| **Drag & Drop** | Drop images directly onto the app |
| **URL Import** | Paste any image URL to fetch and add it instantly |
| **Auto Center Crop** | Snaps to the nearest TERA ratio - `1:1` · `3:2` · `16:9` |
| **Before / After Preview** | Click any file to compare original vs converted side-by-side |
| **2x Upscale** | Two-pass canvas USM sharpening - instant, zero dependencies |
| **Save** | One-click download to your Downloads folder |
| **Save As** | Choose any output folder via the File System Access API |
| **Batch Processing** | Convert dozens of images in one go |


## TERA Image Spec

| | Minimum | Maximum |
|---|---------|---------|
| **Width** | 1281 px | 4096 px |
| **Height** | 600 px | 4096 px |
| **Aspect Ratio** | 1:1 / 3:2 / 16:9 | - |
| **Format** | JPEG 0.92 | - |


## How to Use

1. Open the app in **Chrome or Edge**
2. Drag & drop images - or paste an image URL and press **Enter**
3. Toggle **2x Upscale** if you want edge sharpening applied
4. Hit **Save** to download, or **Save As** to pick a folder
5. Click any converted file to preview before vs after

> **Note:** Safari and Firefox do not support the File System Access API - **Save As** will not work.


## 2x Upscale - How It Works

Two sequential passes of **Unsharp Mask (USM)** sharpening, applied entirely on the HTML5 canvas:

```
Pass 1 - broad edges:   output = clamp( src + 3.0 × (src − blur(3px)) )
Pass 2 - fine detail:   output = clamp( src + 2.0 × (src − blur(3px)) )
```

No model downloads. No external API calls. No latency.


## Visitor Stats

<!-- STATS_START -->
| Date | Views | Unique Visitors |
|------|-------|----------------|
| — | — | — |
| **Total** | **0** | **0** |

*Last updated: 2026-07-07*
<!-- STATS_END -->


## Supported Formats

`JPG` · `PNG` · `WEBP` · `BMP` · `GIF`


## Tech Stack

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat-square&logo=github&logoColor=white)

- **Canvas API** - image processing & USM sharpening
- **File System Access API** - folder-level file saving
- **Google Analytics GA4** - visitor tracking
