/**
 * Shrink static images under public/assets for GitHub Pages.
 * Branch deploys time out around ~600MB ("Timeout reached, aborting!").
 *
 * Person thumbs stay sharper (no palette dither, higher quality) — map bubbles
 * show faces small but need clean pixels on retina.
 */
import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

type Job = {
  dir: string
  maxWidth: number
  maxHeight: number
  fit: keyof sharp.FitEnum
  /** Skip rewrite when file is already tiny (bytes). */
  skipBelowBytes?: number
  png: {
    compressionLevel: number
    quality: number
    palette: boolean
    effort?: number
  }
}

const jobs: Job[] = [
  {
    dir: 'public/assets/publication',
    maxWidth: 360,
    maxHeight: 504,
    fit: 'inside',
    png: { compressionLevel: 9, palette: true, quality: 65, effort: 8 },
  },
  {
    dir: 'public/assets/location',
    maxWidth: 480,
    maxHeight: 200,
    fit: 'cover',
    png: { compressionLevel: 9, palette: true, quality: 65, effort: 8 },
  },
  {
    dir: 'public/assets/person_big',
    maxWidth: 200,
    maxHeight: 300,
    fit: 'inside',
    png: { compressionLevel: 9, palette: true, quality: 70, effort: 8 },
  },
  {
    // Map / timeline face chips — lighter compression than covers.
    dir: 'public/assets/person',
    maxWidth: 64,
    maxHeight: 64,
    fit: 'cover',
    skipBelowBytes: 12_000,
    png: { compressionLevel: 6, palette: false, quality: 90, effort: 6 },
  },
]

const IMAGE_RE = /\.(png|jpe?g|webp)$/i

async function compressFile(path: string, job: Job) {
  const before = statSync(path).size
  const meta = await sharp(path).metadata()
  const skipBelow = job.skipBelowBytes ?? 40_000
  const needsResize =
    (meta.width ?? 0) > job.maxWidth || (meta.height ?? 0) > job.maxHeight || before > 80_000

  if (!needsResize && before < skipBelow) return { before, after: before, skipped: true }

  const buf = await sharp(path)
    .resize(job.maxWidth, job.maxHeight, { fit: job.fit, withoutEnlargement: true })
    .png(job.png)
    .toBuffer()

  if (buf.length >= before * 0.95) return { before, after: before, skipped: true }
  await Bun.write(path, buf)
  return { before, after: buf.length, skipped: false }
}

let saved = 0
let touched = 0
for (const job of jobs) {
  let files: string[]
  try {
    files = readdirSync(job.dir).filter(f => IMAGE_RE.test(f))
  } catch {
    console.warn(`\n${job.dir}: missing, skip`)
    continue
  }
  console.log(`\n${job.dir}: ${files.length} files`)
  for (const file of files) {
    const path = join(job.dir, file)
    try {
      const r = await compressFile(path, job)
      if (!r.skipped) {
        touched += 1
        saved += r.before - r.after
        if (touched % 50 === 0) {
          console.log(`  … ${touched} rewritten, saved ${(saved / 1e6).toFixed(1)} MB`)
        }
      }
    } catch (err) {
      console.warn(`  skip ${file}:`, err)
    }
  }
}

console.log(`\nDone. Rewrote ${touched} files, saved ${(saved / 1e6).toFixed(1)} MB`)
