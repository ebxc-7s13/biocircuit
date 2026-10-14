import sharp from 'sharp'
import { createServer } from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import { pathToFileURL } from 'node:url'
const MAX = 5 * 1024 * 1024
sharp.cache(false)
sharp.concurrency(1)
export async function processAvatar(bytes, mime, purpose = 'avatar') {
  if (!['avatar', 'project'].includes(purpose))
    throw Error('Image purpose refused')
  if (bytes.length < 8 || bytes.length > MAX) throw Error('File size refused')
  const png = Buffer.from(bytes)
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (!((mime === 'image/png' && png) || (mime === 'image/jpeg' && jpg)))
    throw Error('File format refused')
  const pipeline = sharp(bytes, {
    limitInputPixels: 10_000_000,
    failOn: 'warning',
    animated: false,
  })
  const metadata = await pipeline.metadata()
  if (!['png', 'jpeg'].includes(metadata.format) || metadata.pages > 1)
    throw Error('File format refused')
  const output = pipeline
    .rotate()
    .resize(
      purpose === 'avatar' ? 256 : 2048,
      purpose === 'avatar' ? 256 : 2048,
      {
        fit: purpose === 'avatar' ? 'cover' : 'inside',
        withoutEnlargement: true,
      },
    )
    .timeout({ seconds: 3 })
  const encoded = await (
    purpose === 'avatar' ? output.webp({ quality: 80 }) : output.png()
  ).toBuffer()
  if (encoded.length > (purpose === 'avatar' ? 512 * 1024 : MAX))
    throw Error('Processed image size refused')
  return encoded
}
export function avatarServer(secret) {
  if (!secret || secret.length < 32)
    throw Error('PROCESSOR_TOKEN must contain at least 32 characters')
  let active = 0
  const server = createServer(async (req, res) => {
    const answer = (status, data) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      res.end(JSON.stringify(data))
    }
    const bearer = Buffer.from(req.headers.authorization ?? '')
    const expected = Buffer.from('Bearer ' + secret)
    if (bearer.length !== expected.length || !timingSafeEqual(bearer, expected))
      return answer(401, { error: 'Unauthorized' })
    if (
      req.method !== 'POST' ||
      !['/avatar', '/project-image'].includes(req.url)
    )
      return answer(404, { error: 'Unavailable' })
    if (active >= 2) return answer(429, { error: 'Busy' })
    if (Number(req.headers['content-length'] ?? 0) > MAX)
      return answer(413, { error: 'File too large' })
    active++
    try {
      let size = 0
      const chunks = []
      for await (const chunk of req) {
        size += chunk.length
        if (size > MAX) {
          answer(413, { error: 'File too large' })
          return
        }
        chunks.push(chunk)
      }
      const output = await processAvatar(
        Buffer.concat(chunks),
        req.headers['content-type'],
        req.url === '/avatar' ? 'avatar' : 'project',
      )
      res.writeHead(200, {
        'Content-Type': req.url === '/avatar' ? 'image/webp' : 'image/png',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      res.end(output)
    } catch {
      answer(400, { error: 'Image rejected' })
    } finally {
      active--
    }
  })
  server.requestTimeout = 15000
  server.headersTimeout = 10000
  server.maxRequestsPerSocket = 10
  return server
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const server = avatarServer(process.env.PROCESSOR_TOKEN)
  server.listen(Number(process.env.PROCESSOR_PORT ?? 8787), '127.0.0.1', () =>
    console.log(
      'Avatar processor listening on loopback; TLS proxy required for Edge access.',
    ),
  )
}
