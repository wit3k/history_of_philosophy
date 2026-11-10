import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const docs = join(import.meta.dirname, '..', 'docs')
const indexHtml = join(docs, 'index.html')
const fallbackHtml = join(docs, '404.html')

if (!existsSync(indexHtml)) {
  console.error('spa-fallback: docs/index.html missing — run the github build first')
  process.exit(1)
}

copyFileSync(indexHtml, fallbackHtml)
console.log('spa-fallback: wrote docs/404.html for GitHub Pages /map deep links')
