// @vitest-environment node
import { afterAll, beforeAll, expect, it } from 'vitest'
import { randomBytes } from 'node:crypto'
import { request } from 'node:http'
import type { Server, AddressInfo } from 'node:net'
import sharp from 'sharp'
// @ts-expect-error Node-only server module has no TypeScript declaration.
import { avatarServer } from '../scripts/avatar-processor.mjs'

const token = randomBytes(32).toString('hex')
let server: Server
let origin: string
beforeAll(async () => {
  server = avatarServer(token)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  origin = 'http://127.0.0.1:' + (server.address() as AddressInfo).port
})
afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
})

it('processor HTTP denies unauthenticated requests without disclosing secrets', async () => {
  for (const authorization of ['', 'Bearer invalid']) {
    const response = await fetch(origin + '/avatar', {
      method: 'POST',
      headers: { authorization },
      body: 'invalid',
    })
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const body = await response.text()
    expect(body).not.toContain(token)
    expect(body).toContain('Unauthorized')
  }
})

it('processor HTTP only exposes the two authenticated POST routes', async () => {
  for (const [path, method] of [
    ['/avatar', 'GET'],
    ['/proxy?url=https://example.com', 'POST'],
  ]) {
    const response = await fetch(origin + path, {
      method,
      headers: { authorization: 'Bearer ' + token },
    })
    expect(response.status).toBe(404)
  }
})

it('processor HTTP re-encodes real image bytes and rejects spoofed MIME', async () => {
  const input = await sharp({
    create: { width: 64, height: 32, channels: 3, background: '#345678' },
  })
    .png()
    .withMetadata()
    .toBuffer()
  const response = await fetch(origin + '/avatar', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'Content-Type': 'image/png' },
    body: input,
  })
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toBe('image/webp')
  const metadata = await sharp(
    Buffer.from(await response.arrayBuffer()),
  ).metadata()
  expect(metadata.format).toBe('webp')
  expect(metadata.exif).toBeUndefined()
  expect(metadata.icc).toBeUndefined()
  const refused = await fetch(origin + '/project-image', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'Content-Type': 'image/jpeg' },
    body: input,
  })
  expect(refused.status).toBe(400)
  expect(await refused.json()).toEqual({ error: 'Image rejected' })
})

it('processor HTTP rejects oversized declared uploads before decoding', async () => {
  const status = await new Promise<number | undefined>((resolve, reject) => {
    const upload = request(
      origin + '/avatar',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + token,
          'Content-Type': 'image/png',
          'Content-Length': 5 * 1024 * 1024 + 1,
          Connection: 'close',
        },
      },
      (response) => {
        response.resume()
        resolve(response.statusCode)
      },
    )
    upload.on('error', reject)
    upload.end()
  })
  expect(status).toBe(413)
})
