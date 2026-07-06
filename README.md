# TERA Image Converter

> Traveloka TERA 이미지 규격에 맞게 자동으로 크롭·리사이즈해주는 웹 앱

**→ [https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/)**

[![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgeresia.github.io%2FTVLK_TERA_IMG_CONVERTER%2F&count_bg=%230EA5E9&title_bg=%23334155&icon=&icon_color=%23FFFFFF&title=visitors&edge_flat=true)](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/)
![GitHub last commit](https://img.shields.io/github/last-commit/Geresia/TVLK_TERA_IMG_CONVERTER?style=flat-square&color=334155)

![Preview](docs/preview.svg)

---

## 방문자 현황

| 기간 | 총 페이지뷰 | 순방문자 |
|------|------------|---------|
| 2026-07-02 | 4 | 1 |
| 2026-07-03 | 52 | 2 |
| **누적 합계** | **56** | **2** |

> 2026-07-02 배포 이후 집계 / Google Analytics GA4 연동 완료

---

## 기능

| 기능 | 설명 |
|------|------|
| **드래그 & 드롭** | 이미지를 드래그하거나 클릭해서 추가 |
| **URL로 추가** | 이미지 URL을 붙여넣으면 자동 다운로드 후 추가 |
| **자동 센터 크롭** | 원본 비율에 가장 가까운 TERA 규격(`1:1` / `3:2` / `16:9`)으로 중앙 크롭 |
| **Before / After 미리보기** | 변환된 파일 클릭 시 원본 vs 결과 비교 |
| **2x Upscale** | 캔버스 기반 Unsharp Mask 샤프닝 — 즉시 처리, 외부 서버 불필요 |
| **Save** | 변환된 파일을 Downloads 폴더에 자동 저장 |
| **Save As** | 원하는 폴더를 직접 선택해서 저장 |
| **배치 처리** | 여러 장을 한 번에 변환 |

---

## TERA 이미지 규격

| 항목 | 최솟값 | 최댓값 |
|------|--------|--------|
| 너비 | 1281 px | 4096 px |
| 높이 | 600 px | 4096 px |
| 비율 | 1:1 / 3:2 / 16:9 | - |
| 포맷 | JPEG 품질 0.92 | - |

---

## 사용 방법

1. **Chrome 또는 Edge**에서 [앱](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/) 열기
2. 이미지를 드래그하거나, URL 입력창에 이미지 주소 붙여넣기
3. 샤프닝이 필요하면 **2x Upscale** 토글 ON
4. **Save** (자동 다운로드) 또는 **Save As** (폴더 선택) 클릭
5. 변환된 파일 클릭 시 원본과 결과를 나란히 비교 가능

> ⚠️ Safari / Firefox는 File System Access API를 지원하지 않아 **Save As** 기능 불가

---

## 2x Upscale 상세

캔버스 기반 **Unsharp Mask(USM)** 샤프닝을 2단계로 적용합니다.

```
1차: blur(3px) radius, amount = 3.0  → 넓은 엣지 강조
2차: blur(3px) radius, amount = 2.0  → 세부 디테일 보완

수식: output = clamp(original + amount × (original − blurred))
```

모델 다운로드 없음 · 외부 API 없음 · 완전 브라우저 처리

---

## 지원 포맷

`JPG` · `PNG` · `WEBP` · `BMP` · `GIF`

---

## 기술 스택

- **React 18** + TypeScript + Vite 6
- **Tailwind CSS v4**
- **Canvas API** — 이미지 처리 + USM 샤프닝
- **File System Access API** — 폴더 선택 저장
- **Google Analytics GA4** — 방문자 추적
- **GitHub Pages** (`gh-pages` 브랜치 배포)
