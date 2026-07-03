# TERA Image Converter

TERA 규격에 맞게 이미지를 자동으로 크롭·리사이즈하는 웹 도구입니다.

**→ [https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/)**

![Preview](docs/preview.svg)

---

## 기능

- 이미지를 드래그 앤 드롭하거나 클릭해서 추가
- TERA 규격에 맞게 **자동 center-crop**
  - 비율: `1:1` / `3:2` / `16:9` 중 가장 가까운 비율로 크롭
  - 최소 `800×600`, 최대 `4096×4096`
  - 너비 1280px 이하는 자동으로 1281px로 업스케일
- JPEG 0.92 품질로 저장
- 여러 장 **배치 처리** 지원
- 출력 폴더를 직접 지정해서 바로 저장

## 사용법

1. [링크](https://geresia.github.io/TVLK_TERA_IMG_CONVERTER/) 접속 (Chrome / Edge 권장)
2. **출력 폴더 선택** → 저장할 폴더 지정
3. 이미지 파일 드래그 또는 클릭해서 추가
4. **▶ 변환 시작** 클릭

> Safari / Firefox는 파일 저장 기능(File System Access API) 미지원

## 지원 포맷

`JPG` · `PNG` · `WEBP` · `BMP` · `GIF`

## 기술 스택

- React 18 + TypeScript + Vite
- Tailwind CSS v4
- Canvas API (이미지 처리)
- File System Access API (파일 저장)
- GitHub Pages (배포)
