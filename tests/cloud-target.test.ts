import { expect, it } from 'vitest'
// @ts-expect-error Node-only JavaScript guard is never bundled into the application.
import {
  validateTarget,
  assertPublicKey,
  localSessionPath,
  validateRequestedTarget,
} from '../scripts/cloud-target.mjs'
const fixture = {
  projectRef: 'abcdefghijklmnopqrst',
  projectName: 'biocircuit-staging',
  isolatedDevelopment: true,
  url: 'https://abcdefghijklmnopqrst.supabase.co',
  frontendOrigin: 'http://127.0.0.1:5190',
}
it('requires explicit isolated staging identity and matching endpoint', () => {
  expect(validateTarget(fixture).projectName).toBe('biocircuit-staging')
  for (const change of [
    { isolatedDevelopment: false },
    { projectName: 'production' },
    { projectRef: 'unknown' },
    { url: 'https://another.example' },
    { url: 'https://abcdefghijklmnopqrst.supabase.co/?token=private' },
    { frontendOrigin: 'https://public.example' },
    { frontendOrigin: 'http://127.0.0.1:5190/path' },
  ])
    expect(() => validateTarget({ ...fixture, ...change })).toThrow()
})
it('rejects all privileged or malformed keys without exposing values', () => {
  assertPublicKey('sb_publishable_synthetic_fixture')
  const jwt = (role: string) =>
    'eyJheader.' +
    Buffer.from(JSON.stringify({ role })).toString('base64url') +
    '.fixture'
  assertPublicKey(jwt('anon'))
  for (const key of [
    'sb_secret_synthetic_fixture',
    jwt('service_role'),
    jwt('authenticated'),
    'broken',
  ]) {
    try {
      assertPublicKey(key)
      throw Error('Unexpected acceptance')
    } catch (error) {
      expect(String(error)).not.toContain(key)
      expect(String(error)).toContain('Only a publishable')
    }
  }
})
it('keeps session artifacts inside the ignored local cloud directory', () => {
  expect(localSessionPath('.cloud/sessions.json')).toContain('.cloud')
  for (const file of ['docs/sessions.json', '.cloud/../session.json'])
    expect(() => localSessionPath(file)).toThrow()
})

it('rejects an unverified designation or a different user-authorized reference', () => {
  const target = validateTarget(fixture)
  const requested = {
    projectRef: fixture.projectRef,
    userConfirmedStaging: true,
    remoteIdentityVerified: true,
  }
  expect(() => validateRequestedTarget(target, requested)).not.toThrow()
  for (const change of [
    { projectRef: 'ibxubsegrabpspopdgep' },
    { remoteIdentityVerified: false },
    { userConfirmedStaging: false },
  ])
    expect(() =>
      validateRequestedTarget(target, { ...requested, ...change }),
    ).toThrow()
})
