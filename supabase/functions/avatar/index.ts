import { allowed, authenticate, body, headers, reply } from '../_shared/http.ts'
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
    const profile = await auth.client
      .from('profiles')
      .select('suspended')
      .eq('id', auth.user.id)
      .single()
    if (profile.error || profile.data.suspended)
      return reply(origin, 403, { error: 'Account restricted' })
    if (req.headers.get('content-type')?.startsWith('application/json')) {
      const input = await body(req)
      if (input.operation === 'read') {
        const { data, error } = await auth.client
          .from('avatars')
          .select('path')
          .eq('user_id', input.user_id ?? auth.user.id)
          .maybeSingle()
        if (error) return reply(origin, 503, { error: 'Avatar unavailable' })
        // No avatar yet is an ordinary state, not a failed request.
        if (!data) return reply(origin, 200, { url: null })
        const signed = await auth.admin.storage
          .from('avatars')
          .createSignedUrl(data.path, 60)
        if (signed.error)
          return reply(origin, 503, { error: 'Avatar unavailable' })
        return reply(origin, 200, { url: signed.data.signedUrl })
      }
      if (input.operation === 'delete') {
        const old = await auth.admin
          .from('avatars')
          .select('path')
          .eq('user_id', auth.user.id)
          .maybeSingle()
        if (old.error)
          return reply(origin, 503, { error: 'Avatar unavailable' })
        if (old.data) {
          const removed = await auth.admin.storage
            .from('avatars')
            .remove([old.data.path])
          if (removed.error)
            return reply(origin, 503, { error: 'Avatar removal unavailable' })
          const deleted = await auth.admin
            .from('avatars')
            .delete()
            .eq('user_id', auth.user.id)
          if (deleted.error)
            return reply(origin, 503, { error: 'Avatar removal unavailable' })
        }
        return reply(origin, 200, { deleted: true })
      }
      return reply(origin, 400, { error: 'Unsupported operation' })
    }
    const processor = Deno.env.get('AVATAR_PROCESSOR_URL')
    const token = Deno.env.get('AVATAR_PROCESSOR_TOKEN')
    if (
      !processor ||
      !token ||
      token.length < 32 ||
      !processor.startsWith('https://')
    )
      return reply(origin, 503, {
        error: 'Image processing service is not configured',
      })
    const budget = await auth.client.rpc('avatar_budget')
    if (budget.error)
      return reply(origin, 429, { error: 'Please wait before another upload' })
    if (
      Number(req.headers.get('content-length') ?? 0) >
      5 * 1024 * 1024 + 16384
    )
      return reply(origin, 413, { error: 'File too large' })
    const reader = req.body?.getReader()
    if (!reader) return reply(origin, 400, { error: 'File required' })
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const next = await reader.read()
      if (next.done) break
      size += next.value.length
      if (size > 5 * 1024 * 1024 + 16384) {
        await reader.cancel()
        return reply(origin, 413, { error: 'File too large' })
      }
      chunks.push(next.value)
    }
    const joined = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      joined.set(chunk, offset)
      offset += chunk.length
    }
    const form = await new Request(req.url, {
      method: 'POST',
      headers: { 'Content-Type': req.headers.get('content-type') ?? '' },
      body: joined,
    }).formData()
    const file = form.get('file')
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      !['image/png', 'image/jpeg'].includes(file.type) ||
      !/\.(png|jpe?g)$/i.test(file.name)
    )
      return reply(origin, 400, { error: 'Use a PNG or JPEG image under 5 MB' })
    const processed = await fetch(processor, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': file.type },
      body: file,
      signal: AbortSignal.timeout(8000),
      redirect: 'error',
    })
    if (!processed.ok || processed.headers.get('content-type') !== 'image/webp')
      return reply(origin, 400, { error: 'Image rejected by validation' })
    const outputReader = processed.body?.getReader()
    if (!outputReader)
      return reply(origin, 503, { error: 'Image processing unavailable' })
    let outputSize = 0
    const outputChunks: Uint8Array[] = []
    while (true) {
      const item = await outputReader.read()
      if (item.done) break
      outputSize += item.value.length
      if (outputSize > 524288) {
        await outputReader.cancel()
        return reply(origin, 503, { error: 'Image processing unavailable' })
      }
      outputChunks.push(item.value)
    }
    const output = new Uint8Array(outputSize)
    let outputOffset = 0
    for (const chunk of outputChunks) {
      output.set(chunk, outputOffset)
      outputOffset += chunk.length
    }
    if (
      output.length > 524288 ||
      output.length < 12 ||
      new TextDecoder().decode(output.slice(0, 4)) !== 'RIFF' ||
      new TextDecoder().decode(output.slice(8, 12)) !== 'WEBP'
    )
      return reply(origin, 503, { error: 'Image processing unavailable' })
    const old = await auth.admin
      .from('avatars')
      .select('path')
      .eq('user_id', auth.user.id)
      .maybeSingle()
    if (old.error) return reply(origin, 503, { error: 'Avatar unavailable' })
    const objectPath = auth.user.id + '/' + crypto.randomUUID() + '.webp'
    const upload = await auth.admin.storage
      .from('avatars')
      .upload(objectPath, output, {
        contentType: 'image/webp',
        upsert: false,
        cacheControl: '60',
      })
    if (upload.error) return reply(origin, 503, { error: 'Upload unavailable' })
    const saved = await auth.admin.from('avatars').upsert({
      user_id: auth.user.id,
      path: objectPath,
      updated_at: new Date().toISOString(),
    })
    if (saved.error) {
      await auth.admin.storage.from('avatars').remove([objectPath])
      return reply(origin, 503, { error: 'Upload could not be saved' })
    }
    if (old.data)
      await auth.admin.storage.from('avatars').remove([old.data.path])
    return reply(origin, 200, { saved: true })
  } catch {
    return reply(origin, 503, { error: 'Avatar service unavailable' })
  }
})
