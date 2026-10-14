import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { randomBytes } from 'node:crypto'
// Node-only first-party processor. It is never imported into the browser.
// @ts-expect-error plain JavaScript server module has no declaration
import { processAvatar, avatarServer } from '../scripts/avatar-processor.mjs'
describe('avatar validation and safe re-encoding', () => {
  it('decodes real PNG, strips metadata and bounds output', async () => {
    const input = await sharp({
      create: { width: 640, height: 480, channels: 3, background: '#647995' },
    })
      .png()
      .withMetadata()
      .toBuffer()
    const out = await processAvatar(input, 'image/png')
    const m = await sharp(out).metadata()
    expect(m.format).toBe('webp')
    expect(m.width).toBe(256)
    expect(m.height).toBe(256)
    expect(m.exif).toBeUndefined()
    expect(m.icc).toBeUndefined()
  })
  it('rejects malformed, spoofed, executable and oversized bytes', async () => {
    for (const [bytes, mime] of [
      [Buffer.from('<svg>executable</svg>'), 'image/png'],
      [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]), 'image/png'],
      [Buffer.alloc(5 * 1024 * 1024 + 1), 'image/png'],
    ])
      await expect(processAvatar(bytes, mime)).rejects.toThrow()
  })
  it('refuses undersized processor authentication secret', () => {
    expect(() => avatarServer('weak')).toThrow()
  })
})

it('project image re-encoding keeps aspect ratio and safe PNG output', async () => {
  const input = await sharp({
    create: { width: 1000, height: 500, channels: 3, background: '#647995' },
  })
    .png()
    .withMetadata()
    .toBuffer()
  const out = await processAvatar(input, 'image/png', 'project')
  const m = await sharp(out).metadata()
  expect(m.format).toBe('png')
  expect(m.width).toBe(1000)
  expect(m.height).toBe(500)
  expect(m.exif).toBeUndefined()
})

it('rotates JPEG pixels and removes camera metadata', async () => {
  const input = await sharp({
    create: { width: 80, height: 40, channels: 3, background: '#647995' },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer()
  const out = await processAvatar(input, 'image/jpeg', 'project')
  const metadata = await sharp(out).metadata()
  expect([metadata.width, metadata.height]).toEqual([40, 80])
  expect(metadata.exif).toBeUndefined()
  expect(metadata.orientation).toBeUndefined()
})

it('refuses compressed dimension bombs before pixel decoding', async () => {
  const input = await sharp({
    create: { width: 4000, height: 3000, channels: 3, background: '#000' },
  })
    .png()
    .toBuffer()
  expect(input.length).toBeLessThan(5 * 1024 * 1024)
  await expect(processAvatar(input, 'image/png', 'project')).rejects.toThrow()
})

it('refuses JPEG to PNG expansion beyond the Edge output limit', async () => {
  const input = await sharp(randomBytes(2048 * 2048 * 3), {
    raw: { width: 2048, height: 2048, channels: 3 },
  })
    .jpeg({ quality: 90 })
    .toBuffer()
  expect(input.length).toBeLessThan(5 * 1024 * 1024)
  await expect(processAvatar(input, 'image/jpeg', 'project')).rejects.toThrow(
    'Processed image size refused',
  )
}, 10000)
