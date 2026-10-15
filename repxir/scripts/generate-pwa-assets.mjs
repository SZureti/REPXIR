// Regenerates the install assets in public/:
//   - app icons and favicon.ico, rendered from public/favicon.svg (the RX
//     monogram with outlined letters, so no font is needed)
//   - manifest screenshots for the richer install dialog (phone and desktop)
// Run after changing the favicon or the screens: npm run pwa-assets
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { build, preview } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const publicDir = new URL('../public/', import.meta.url)
const favicon = await readFile(new URL('favicon.svg', publicDir), 'utf8')
// Maskable and Apple icons must fill the whole square; the OS applies its own mask.
const fullBleed = favicon.replace(/ rx="[\d.]+"/, '')

const ICONS = [
  { file: 'pwa-192x192.png', size: 192, svg: favicon },
  { file: 'pwa-512x512.png', size: 512, svg: favicon },
  { file: 'maskable-icon-512x512.png', size: 512, svg: fullBleed },
  { file: 'apple-touch-icon.png', size: 180, svg: fullBleed },
  { file: 'favicon.ico', size: 32, svg: favicon },
]

// Sizes must match the `screenshots` entries in vite.config.js.
const SCREENSHOTS = [
  { file: 'home-narrow.jpg', path: '/', viewport: { width: 390, height: 844 }, scale: 2 },
  { file: 'workouts-wide.jpg', path: '/workouts', viewport: { width: 1280, height: 800 }, scale: 1 },
]

// A single 32×32 PNG inside an ICO container, for browsers without SVG favicons.
function toIco(png) {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // one image
  header.writeUInt8(32, 6) // width
  header.writeUInt8(32, 7) // height
  header.writeUInt16LE(1, 10) // colour planes
  header.writeUInt16LE(32, 12) // bits per pixel
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(22, 18) // image data offset
  return Buffer.concat([header, png])
}

const browser = await chromium.launch()

const page = await browser.newPage()
for (const { file, size, svg } of ICONS) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${svg}`)
  const png = await page.screenshot({ omitBackground: true })
  await writeFile(new URL(file, publicDir), file.endsWith('.ico') ? toIco(png) : png)
  console.log(`public/${file}`)
}

await build({ root, logLevel: 'warn' })
const server = await preview({ root, logLevel: 'warn', preview: { port: 4180 } })
const baseURL = server.resolvedUrls.local[0]
await mkdir(new URL('screenshots/', publicDir), { recursive: true })
for (const { file, path, viewport, scale } of SCREENSHOTS) {
  // A fresh context each time, so screens show the first-run state.
  const context = await browser.newContext({ baseURL, viewport, deviceScaleFactor: scale, serviceWorkers: 'block' })
  const shot = await context.newPage()
  await shot.goto(path)
  await shot.locator('main h1').first().waitFor()
  await shot.evaluate(() => document.fonts.ready)
  await shot.screenshot({ path: fileURLToPath(new URL(`screenshots/${file}`, publicDir)), type: 'jpeg', quality: 80 })
  console.log(`public/screenshots/${file}`)
  await context.close()
}

await browser.close()
await server.close()
