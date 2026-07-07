<div align="center">

# TERA Image Converter

**Crop and resize hotel photos to Traveloka TERA specs**

[![Live App](https://img.shields.io/badge/▶%20Launch%20App-0EA5E9?style=for-the-badge&logoColor=white)](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/)
[![Visitors](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FGeresia%2FTVLK_TERA_IMG_CONVERTER%2Fmain%2Fdocs%2Fga4-stats.json&query=%24.total_users&label=visitors&style=for-the-badge&color=0ea5e9&labelColor=334155)](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/)
[![Last Commit](https://img.shields.io/github/last-commit/Geresia/TVLK_TERA_IMG_CONVERTER?style=for-the-badge&color=334155)](https://github.com/Geresia/TVLK_TERA_IMG_CONVERTER/commits/main)

![Preview](docs/preview.svg)

</div>


## Overview

Drop in a hotel photo and it crops, resizes, and optionally sharpens it to match TERA specs. No install needed, just open in the browser and go.

> Chrome or Edge recommended


## Features

| Feature | Description |
|---------|-------------|
| **Drag & Drop** | Drag images straight into the app |
| **URL Import** | Paste an image URL and it gets added automatically |
| **Auto Center Crop** | Crops to the closest TERA ratio: `1:1` `3:2` `16:9` |
| **Before / After Preview** | Click any file to see original vs result |
| **2x Upscale** | Sharpening filter, runs entirely in the browser |
| **Save** | Downloads straight to your Downloads folder |
| **Save As** | Choose where to save the output |
| **Batch Processing** | Convert multiple images at once |


## TERA Image Spec

| | Min | Max |
|---|-----|-----|
| **Width** | 1281 px | 4096 px |
| **Height** | 600 px | 4096 px |
| **Aspect Ratio** | `1:1` `3:2` `16:9` | |
| **Format** | JPEG · quality 0.92 | |


## How to Use

1. Open in Chrome or Edge
2. Drag in images or paste a URL
3. Turn on **2x Upscale** if you want sharpening
4. Hit **Save** or **Save As**
5. Click any file to compare before and after

> **Save As** doesn't work in Safari or Firefox.


## 2x Upscale

Applies **Unsharp Mask (USM)** sharpening on the canvas twice, with different radius settings each time.

```
Round 1  blur(3px) · amount 3.0
Round 2  blur(3px) · amount 2.0

output = clamp( src + amount × (src − blur(src)) )
```

No external calls, works offline.


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
