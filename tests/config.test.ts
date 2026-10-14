import { it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
it('production config rejects privileged keys without printing them', () => {
  for (const secret of [
    'sb_secret_synthetic_for_test',
    'eyJhbGciOiJIUzI1NiJ9.' +
      Buffer.from(JSON.stringify({ role: 'service_role' })).toString(
        'base64url',
      ) +
      '.synthetic',
  ]) {
    const result = spawnSync(process.execPath, ['scripts/check-config.mjs'], {
      env: { ...process.env, VITE_SUPABASE_PUBLISHABLE_KEY: secret },
      encoding: 'utf8',
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('privileged configuration')
    expect(result.stderr).not.toContain(secret)
  }
})
