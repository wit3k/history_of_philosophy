/**
 * Full GitHub Pages ship: import Noco data → compress assets → build docs/ → commit → push.
 *
 * Requires NOCO_URL + NOCO_TOKEN in the environment (same as `bun run import`).
 *
 * Usage:
 *   bun run deploy:github
 *   bun run deploy:github -- --message "optional commit message"
 */
import { $ } from 'bun'

const args = process.argv.slice(2)
const msgIdx = args.indexOf('--message')
const customMessage =
  msgIdx >= 0 && args[msgIdx + 1] ? args[msgIdx + 1] : null

function fail(step: string, err: unknown): never {
  console.error(`\n✗ ${step} failed`)
  console.error(err)
  process.exit(1)
}

console.log('→ 1/4 import (Noco → public/assets + src/data/imported)')
try {
  await $`bun run import`
} catch (err) {
  fail('import', err)
}

console.log('\n→ 2/4 compress assets + GitHub Pages build (docs/)')
try {
  await $`bun run github`
} catch (err) {
  fail('github build', err)
}

const status = (await $`git status --porcelain`.text()).trim()
if (!status) {
  console.log('\nNothing to commit — working tree clean after build.')
  process.exit(0)
}

console.log('\nChanges to commit:')
console.log(status)

const message =
  customMessage ??
  'Deploy GitHub Pages: refresh import data, compress assets, rebuild docs'

console.log('\n→ 3/4 commit')
try {
  await $`git add -A`
  await $`git commit -m ${message}`
} catch (err) {
  fail('commit', err)
}

console.log('\n→ 4/4 push')
try {
  await $`git push`
} catch (err) {
  fail('push', err)
}

console.log('\n✓ Deploy pipeline finished')
