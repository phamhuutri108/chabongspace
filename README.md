# Cha Bong Space

A browser-based audio canvas that listens to guitar notes, paints watercolor blooms,
shows a front-camera overlay, and records the performance as a WebM video.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. Microphone and camera access work on
`localhost` and on HTTPS deployments.

## Cloudflare Pages

- Connect this repository from GitHub.
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `/`

The app is a static frontend. It does not need a backend unless you later want
online galleries, share links, or cloud video storage.

## Browser Notes

- Recording uses `MediaRecorder` and downloads a `.webm` file.
- The exported video records the watercolor canvas, the camera overlay, and
  microphone audio.
- For the smoothest result, use Chrome or Edge on desktop.
