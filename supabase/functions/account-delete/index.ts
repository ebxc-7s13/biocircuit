import { allowed, authenticate, body, reply, headers } from '../_shared/http.ts'
Deno.serve(async (req) => {
  const origin = allowed(req)
  if (!origin) return new Response('Origin denied', { status: 403 })
  if (req.method === 'OPTIONS')
    return new Response(null, { headers: headers(origin) })
  if (req.method !== 'POST')
    return reply(origin, 405, { error: 'Method unavailable' })
  try {
    const auth = await authenticate(req)
    if (!auth) return reply(origin, 401, { error: 'Sign in required' })
    const input = await body(req)
    if (input.confirm !== 'DELETE')
      return reply(origin, 400, { error: 'Explicit confirmation required' })
    const { count, error: countError } = await auth.admin
      .from('projects')
      .select('id', { head: true, count: 'exact' })
      .eq('owner_id', auth.user.id)
    if (countError)
      return reply(origin, 503, { error: 'Account checks unavailable' })
    if (count)
      return reply(origin, 409, {
        error: 'Transfer owned projects before deletion',
      })
    for (const bucket of ['academic-evidence', 'project-files', 'avatars']) {
      for (let batch = 0; batch < 20; batch++) {
        const { data, error } = await auth.admin.storage
          .from(bucket)
          .list(auth.user.id, { limit: 1000 })
        if (error)
          return reply(origin, 503, {
            error: 'Private storage cleanup unavailable',
          })
        if (data?.some((x) => !x.id))
          return reply(origin, 409, {
            error:
              'Nested storage requires administrator cleanup before account deletion',
          })
        const files = (data ?? [])
          .filter((x) => x.id)
          .map((x) => auth.user.id + '/' + x.name)
        if (files.length) {
          const result = await auth.admin.storage.from(bucket).remove(files)
          if (result.error)
            return reply(origin, 503, {
              error: 'Private storage cleanup unavailable',
            })
        }
        if (files.length < 1000) break
        if (batch === 19)
          return reply(origin, 503, {
            error: 'Storage cleanup limit reached; retry before deletion',
          })
      }
    }
    const { error } = await auth.admin.auth.admin.deleteUser(auth.user.id)
    if (error)
      return reply(origin, 503, { error: 'Account deletion unavailable' })
    return reply(origin, 200, { deleted: true })
  } catch {
    return reply(origin, 503, { error: 'Account deletion unavailable' })
  }
})
