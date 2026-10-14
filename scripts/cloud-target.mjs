import { readFile } from 'node:fs/promises'
import { resolve, relative, isAbsolute } from 'node:path'

export function validateTarget(value) {
  if (!value || !/^[a-z]{20}$/.test(value.projectRef ?? ''))
    throw Error('A designated Supabase project reference is required')
  if (
    !/^biocircuit-staging(?:-[a-z0-9-]+)?$/.test(value.projectName ?? '') ||
    value.isolatedDevelopment !== true
  )
    throw Error(
      'Target must be explicitly confirmed as isolated BioCircuit staging',
    )
  const endpoint = new URL(value.url)
  if (endpoint.href !== `https://${value.projectRef}.supabase.co/`)
    throw Error('Endpoint must match the designated staging reference exactly')
  const origin = new URL(value.frontendOrigin)
  if (
    !['localhost', '127.0.0.1'].includes(origin.hostname) ||
    origin.protocol !== 'http:' ||
    origin.origin !== value.frontendOrigin
  )
    throw Error(
      'Cloud acceptance frontend must remain on an exact loopback origin',
    )
  return {
    projectRef: value.projectRef,
    projectName: value.projectName,
    isolatedDevelopment: true,
    url: endpoint.origin,
    frontendOrigin: origin.origin,
  }
}

export function assertPublicKey(key) {
  if (typeof key !== 'string' || !key || key.startsWith('YOUR_'))
    throw Error('Staging publishable/anon client key is required locally')
  if (key.startsWith('sb_publishable_')) return
  try {
    const payload = JSON.parse(
      Buffer.from(key.split('.')[1], 'base64url').toString(),
    )
    if (key.startsWith('eyJ') && payload.role === 'anon') return
  } catch {
    /* Fail closed without logging input. */
  }
  throw Error('Only a publishable/anon client key is allowed')
}

export async function readTarget() {
  let value
  try {
    value = JSON.parse(await readFile('.cloud/staging.json', 'utf8'))
  } catch {
    throw Error(
      'BLOCKED: designate and verify the confirmed staging target first; see docs/CLOUD_SETUP.md',
    )
  }
  const target = validateTarget(value)
  try {
    const requested = JSON.parse(
      await readFile('.cloud/requested-target.json', 'utf8'),
    )
    validateRequestedTarget(target, requested)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  try {
    const linked = (await readFile('supabase/.temp/project-ref', 'utf8')).trim()
    if (linked !== target.projectRef)
      throw Error('Linked project differs from the designated staging target')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  return target
}

export function validateRequestedTarget(target, requested) {
  if (
    requested.userConfirmedStaging !== true ||
    requested.remoteIdentityVerified !== true ||
    target.projectRef !== requested.projectRef
  )
    throw Error(
      'Requested staging identity must be verified and match the exact authorized reference',
    )
}

export function localSessionPath(file) {
  const location = resolve(file)
  const inside = relative(resolve('.cloud'), location)
  if (!inside || inside.startsWith('..') || isAbsolute(inside))
    throw Error('Session files must remain inside the ignored .cloud directory')
  return location
}
