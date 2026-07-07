<div align="center">

# TERA Image Converter

**Hotel images, TERA-ready in seconds.**

[![Live App](https://img.shields.io/badge/▶%20Launch%20App-0EA5E9?style=for-the-badge&logoColor=white)](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/)
[![Visitors](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FGeresia%2FTVLK_TERA_IMG_CONVERTER%2Fmain%2Fdocs%2Fga4-stats.json&query=%24.total_users&label=visitors&style=for-the-badge&color=0ea5e9&labelColor=334155)](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/)
[![Last Commit](https://img.shields.io/github/last-commit/Geresia/TVLK_TERA_IMG_CONVERTER?style=for-the-badge&color=334155)](https://github.com/Geresia/TVLK_TERA_IMG_CONVERTER/commits/main)

![Preview](docs/preview.svg)

</div>


## Overview

Upload a hotel photo, get a TERA-compliant JPEG out. Handles cropping, resizing, and optional sharpening automatically. No setup, no server, just open and use.

> Works in Chrome and Edge. Everything runs in your browser.


## Features

| Feature | Description |
|---------|-------------|
| **Drag & Drop** | Drop images directly onto the app |
| **URL Import** | Paste any image URL to fetch and convert instantly |
| **Auto Center Crop** | Snaps to the nearest TERA ratio: `1:1` `3:2` `16:9` |
| **Before / After Preview** | Click any file to compare original vs converted |
| **2x Upscale** | Two-pass canvas USM sharpening, instant and offline |
| **Save** | One-click download to your Downloads folder |
| **Save As** | Pick any output folder via File System Access API |
| **Batch Processing** | Convert dozens of images in one go |


## TERA Image Spec

| | Min | Max |
|---|-----|-----|
| **Width** | 1281 px | 4096 px |
| **Height** | 600 px | 4096 px |
| **Aspect Ratio** | `1:1` `3:2` `16:9` | |
| **Format** | JPEG · quality 0.92 | |


## How to Use

```
1. Open in Chrome or Edge
2. Drag & drop images, or paste a URL and press Enter
3. Toggle [2x Upscale] for edge sharpening (optional)
4. Click [Save] to download  /  [Save As] to pick a folder
5. Click any file to preview before vs after
```

> **Safari / Firefox** doesn't support folder saving. Use Chrome or Edge for **Save As**.


## 2x Upscale

Canvas-based **Unsharp Mask (USM)** run twice — first pass catches broad edges, second pass recovers fine detail.

```
Pass 1  blur(3px) · amount 3.0
Pass 2  blur(3px) · amount 2.0

output = clamp( src + amount × (src − blur(src)) )
```

Runs instantly in the browser, no external calls.


## Visitor Stats

<!-- STATS_START -->
| Date | Views | Unique Visitors |
|------|-------|----------------|
| 2026-07-07 | 1 | 1 |
| **Total** | **1** | **1** |

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
