import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

// Uses ordinary current-user clients only. No administrative credentials, final
// deletion confirmation, real documents, arbitrary records or existing object paths.
export async function verifyStagingBoundaries({
  client,
  target,
  publicKey,
  uid,
  victimUid,
  check,
  observe,
}) {
  const current = await client.auth.getUser()
  check(
    'Managed current-user authentication before boundary probes',
    !current.error && current.data.user.id === uid,
  )
  const reference = victimUid ?? uid
  const original = await client
    .from('profiles')
    .select('phone_verified,membership,suspended')
    .eq('id', uid)
    .single()
  check(
    'Account remains phone-unverified and academically unapproved',
    !original.error &&
      !original.data.phone_verified &&
      original.data.membership === 'not_submitted' &&
      !original.data.suspended,
    { status: original.status },
  )
  const flags = await client
    .from('profiles')
    .update({ phone_verified: false, membership: 'not_submitted' })
    .eq('id', reference)
  check(
    victimUid
      ? 'Other-account identity flag direct write denied (same-value probe)'
      : 'Identity flag direct write denied (same-value probe)',
    flags.error?.code === '42501',
    {
      status: flags.status,
      code: flags.error?.code === '42501' ? '42501' : null,
      noElevatedValueAttempted: true,
    },
  )
  const role = await client
    .from('roles')
    .insert({ user_id: reference, role: 'invalid_acceptance_role' })
  check(
    'Role insertion denied before constraint; no valid staff role attempted',
    role.error?.code === '42501',
    {
      status: role.status,
      code: role.error?.code === '42501' ? '42501' : null,
    },
  )
  const project = await client
    .from('projects')
    .update({ title: 'Nonclinical unauthorized staging probe' })
    .eq('owner_id', reference)
  check(
    'Restricted project direct DML denied',
    project.error?.code === '42501',
    {
      status: project.status,
      code: project.error?.code === '42501' ? '42501' : null,
      populatedProjectIsolationProven: false,
    },
  )
  for (const [type, payload] of [
    ['post', {}],
    ['comment', { post_id: randomUUID() }],
    ['reaction', { post_id: randomUUID() }],
    ['bookmark', { post_id: randomUUID() }],
    [
      'application',
      {
        user_id: reference,
        institution: 'Staging-only privacy probe',
        degree: 'B.Tech / BE',
        discipline: 'Biomedical Engineering',
        result_status: 'completed',
        year: 2026,
        private_marks: '',
      },
    ],
    [
      'project',
      {
        user_id: reference,
        title: 'Staging-only unapproved project probe',
        visibility: 'private',
      },
    ],
    [
      'review',
      {
        user_id: reference,
        status: 'pending',
        reason: 'Staging permission probe only',
      },
    ],
    ['suspend', { target_id: reference, suspended: false }],
  ]) {
    const r = await client.rpc('community_action', {
      action_type: type,
      payload,
      request_id: randomUUID(),
    })
    check(
      'Unverified ordinary account denied ' + type + ' RPC',
      r.error?.code === '42501',
      { status: r.status, code: r.error?.code === '42501' ? '42501' : null },
    )
  }
  for (const name of ['storage_cleanup_batch', 'community_health']) {
    const r = await client.rpc(name)
    check(
      'Privileged read-only ' + name + ' denied',
      r.error?.code === '42501',
      { status: r.status, code: r.error?.code === '42501' ? '42501' : null },
    )
  }
  const exported = await client.rpc('export_personal_data')
  check(
    'Hosted personal export contains only caller profile/preferences',
    !exported.error &&
      exported.data.profile.id === uid &&
      exported.data.preferences.user_id === uid,
    { status: exported.status, otherIdentityExported: false },
  )
  const forgedExport = await client.rpc('export_personal_data', {
    user_id: reference,
  })
  check(
    'Export RPC rejects caller-selected identity parameter',
    forgedExport.error?.code === 'PGRST202',
    {
      status: forgedExport.status,
      code: forgedExport.error?.code === 'PGRST202' ? 'PGRST202' : null,
    },
  )
  const png = await sharp({
    create: { width: 2, height: 2, channels: 3, background: '#3056ff' },
  })
    .png()
    .toBuffer()
  const webp = await sharp(png).webp().toBuffer()
  for (const [bucket, data, type, ext] of [
    ['avatars', webp, 'image/webp', 'webp'],
    ['project-files', png, 'image/png', 'png'],
    ['academic-evidence', png, 'image/png', 'png'],
  ]) {
    const path = reference + '/' + randomUUID() + '.' + ext
    const r = await client.storage
      .from(bucket)
      .upload(path, data, { contentType: type, upsert: false })
    check(
      'Direct valid synthetic upload denied: ' + bucket,
      !!r.error && String(r.error.statusCode) === '403',
      {
        statusCode:
          r.error &&
          ['400', '401', '403', '404'].includes(String(r.error.statusCode))
            ? Number(r.error.statusCode)
            : null,
        validSyntheticImage: true,
        noExistingObjectOverwritten: true,
        foreignPrefix: !!victimUid,
      },
    )
  }
  const session = await client.auth.getSession()
  const token = session.data.session?.access_token
  const parts = token.split('.')
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  const forged = [
    parts[0],
    Buffer.from(
      JSON.stringify({ ...claims, sub: reference, role: 'service_role' }),
    ).toString('base64url'),
    parts[2],
  ].join('.')
  const deniedToken = await fetch(
    target.url + '/rest/v1/profiles?select=id&limit=1',
    {
      headers: { apikey: publicKey, Authorization: 'Bearer ' + forged },
      signal: AbortSignal.timeout(15000),
    },
  )
  check(
    'Tampered identity/privileged-role JWT rejected',
    deniedToken.status === 401,
    { status: deniedToken.status, validStaffTokenCreated: false },
  )
  const deletion = await fetch(target.url + '/functions/v1/account-delete', {
    method: 'POST',
    headers: {
      apikey: publicKey,
      Authorization: 'Bearer ' + token,
      Origin: target.frontendOrigin,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirm: 'KEEP', user_id: reference }),
    signal: AbortSignal.timeout(15000),
  })
  check(
    'Deletion rejects missing final confirmation and forged target',
    deletion.status === 400,
    { status: deletion.status, destructiveConfirmationSent: false },
  )
  const after = await client.auth.getUser()
  const profile = await client
    .from('profiles')
    .select('phone_verified,membership,suspended')
    .eq('id', uid)
    .single()
  const roles = await client.from('roles').select('role').eq('user_id', uid)
  check(
    'Safety probes leave real identity and restrictions unchanged',
    !after.error &&
      after.data.user.id === uid &&
      !profile.error &&
      !profile.data.phone_verified &&
      profile.data.membership === 'not_submitted' &&
      !profile.data.suspended &&
      !roles.error &&
      roles.data.length === 0,
    {
      sameIdentity: true,
      phoneVerified: false,
      academicallyApproved: false,
      staffRoleCount: 0,
    },
  )
  observe(
    'LIMITED - NOT DESTRUCTIVE ACCEPTANCE',
    'Account deletion final confirmation, owner-project conflict and Storage cleanup require separately authorized disposable identity/fixtures. No account was deleted.',
  )
}
