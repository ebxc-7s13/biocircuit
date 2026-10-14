import { readFile, readdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import assert from 'node:assert/strict'
const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
const initialFiles = new Set()
const visited = new Set()
const walk = (key) => {
  if (visited.has(key)) return
  visited.add(key)
  const item = manifest[key]
  if (!item) return
  initialFiles.add(item.file.split('/').at(-1))
  for (const dependency of item.imports ?? []) walk(dependency)
}
for (const [key, item] of Object.entries(manifest)) if (item.isEntry) walk(key)
let initialJs = 0
let css = 0
const chunks = []
for (const name of await readdir('dist/assets')) {
  if (!/\.(js|css)$/.test(name)) continue
  const bytes = await readFile('dist/assets/' + name)
  const contents = bytes.toString()
  assert.ok(
    !/sb_secret_[A-Za-z0-9]+|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(
      contents,
    ),
    'Privileged key material in bundle',
  )
  if (initialFiles.has(name) && name.endsWith('.js'))
    initialJs += gzipSync(bytes).length
  if (name.endsWith('.css')) css += gzipSync(bytes).length
  chunks.push({
    name,
    bytes: bytes.length,
    gzip: gzipSync(bytes).length,
    initial: initialFiles.has(name),
  })
}
assert.ok(
  initialJs < 180000,
  'Entry and static JavaScript imports exceed 180 kB gzip budget',
)
assert.ok(css < 10000, 'CSS exceeds 10 kB gzip budget')
console.log(
  JSON.stringify(
    {
      initialJsGzip: initialJs,
      cssGzip: css,
      chunks,
      note: 'Connected mode also loads the SDK dynamic chunk. This is an entry budget, not a total connected download budget.',
    },
    null,
    2,
  ),
)
