import { allowed, authenticate, headers, reply, body } from '../_shared/http.ts'
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
    if (req.headers.get('content-type')?.startsWith('application/json')) {
      const input = await body(req)
      let query = auth.client
        .from('project_images')
        .select('*')
        .eq(
          input.operation === 'list' ? 'project_id' : 'id',
          input.operation === 'list' ? input.project_id : input.file_id,
        )
        .order('id')
        .limit(50)
      if (input.operation === 'list' && input.after_id)
        query = query.gt('id', input.after_id)
      const { data, error } = await query
      if (error) return reply(origin, 503, { error: 'Images unavailable' })
      if (input.operation === 'list')
        return reply(origin, 200, {
          files:
            data?.map(({ id, user_id, project_id, created_at }) => ({
              id,
              user_id,
              project_id,
              created_at,
            })) ?? [],
        })
      const file = data?.[0]
      if (!file) return reply(origin, 404, { error: 'Image unavailable' })
      if (input.operation === 'read') {
        const signed = await auth.admin.storage
          .from('project-files')
          .createSignedUrl(file.path, 60)
        if (signed.error)
          return reply(origin, 503, { error: 'Image unavailable' })
        return reply(origin, 200, { url: signed.data.signedUrl })
      }
      if (input.operation === 'delete') {
        const project = await auth.client
          .from('projects')
          .select('owner_id')
          .eq('id', file.project_id)
          .single()
        if (
          file.user_id !== auth.user.id &&
          project.data?.owner_id !== auth.user.id
        )
          return reply(origin, 403, { error: 'Permission denied' })
        const removed = await auth.admin.storage
          .from('project-files')
          .remove([file.path])
        if (removed.error)
          return reply(origin, 503, { error: 'Removal unavailable' })
        const deleted = await auth.admin
          .from('project_images')
          .delete()
          .eq('id', file.id)
        if (deleted.error)
          return reply(origin, 503, { error: 'Removal unavailable' })
        await auth.admin.from('audit').insert({
          actor_id: auth.user.id,
          action: 'project_image_delete',
          target_id: file.id,
          reason: 'Explicit image removal by uploader or project owner',
        })
        return reply(origin, 200, { deleted: true })
      }
      return reply(origin, 400, { error: 'Unsupported operation' })
    }
    const processor = Deno.env.get('PROJECT_IMAGE_PROCESSOR_URL')
    const token = Deno.env.get('AVATAR_PROCESSOR_TOKEN')
    if (!processor?.startsWith('https://') || !token || token.length < 32)
      return reply(origin, 503, {
        error: 'Project image processor is not configured',
      })
    const reader = req.body?.getReader()
    if (!reader) return reply(origin, 400, { error: 'File required' })
    let size = 0
    const chunks: Uint8Array[] = []
    while (true) {
      const item = await reader.read()
      if (item.done) break
      size += item.value.length
      if (size > 5 * 1024 * 1024 + 16384) {
        await reader.cancel()
        return reply(origin, 413, { error: 'File too large' })
      }
      chunks.push(item.value)
    }
    const inputBytes = new Uint8Array(size)
    let off = 0
    for (const chunk of chunks) {
      inputBytes.set(chunk, off)
      off += chunk.length
    }
    const form = await new Request(req.url, {
      method: 'POST',
      headers: { 'Content-Type': req.headers.get('content-type') ?? '' },
      body: inputBytes,
    }).formData()
    const file = form.get('file')
    const pid = form.get('project_id')
    const id = form.get('request_id')
    if (
      typeof pid !== 'string' ||
      typeof id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        pid,
      ) ||
      !/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(
        id,
      ) ||
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      !['image/png', 'image/jpeg'].includes(file.type) ||
      !/\.(png|jpe?g)$/i.test(file.name)
    )
      return reply(origin, 400, {
        error: 'Use PNG/JPEG under 5 MB in a project you belong to',
      })
    const budget = await auth.client.rpc('project_image_budget', {
      pid,
      image_id: id,
    })
    if (budget.error)
      return reply(origin, 403, {
        error: 'Project permission or upload budget unavailable',
      })
    const existing = await auth.client
      .from('project_images')
      .select('id,user_id,project_id')
      .eq('id', id)
      .maybeSingle()
    if (existing.data) {
      if (
        existing.data.user_id !== auth.user.id ||
        existing.data.project_id !== pid
      )
        return reply(origin, 409, { error: 'Request identifier unavailable' })
      return reply(origin, 200, { saved: true })
    }
    const upstream = await fetch(processor, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': file.type },
      body: file,
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    })
    if (!upstream.ok || upstream.headers.get('content-type') !== 'image/png')
      return reply(origin, 400, { error: 'Image rejected by validation' })
    const outputReader = upstream.body?.getReader()
    if (!outputReader)
      return reply(origin, 503, { error: 'Processor unavailable' })
    let outputSize = 0
    const outputChunks: Uint8Array[] = []
    while (true) {
      const item = await outputReader.read()
      if (item.done) break
      outputSize += item.value.length
      if (outputSize > 5 * 1024 * 1024) {
        await outputReader.cancel()
        return reply(origin, 413, { error: 'Processed image too large' })
      }
      outputChunks.push(item.value)
    }
    const output = new Uint8Array(outputSize)
    off = 0
    for (const chunk of outputChunks) {
      output.set(chunk, off)
      off += chunk.length
    }
    if (output.slice(0, 8).join(',') !== '137,80,78,71,13,10,26,10')
      return reply(origin, 503, { error: 'Processor unavailable' })
    const objectPath = auth.user.id + '/' + id + '.png'
    const stored = await auth.admin.storage
      .from('project-files')
      .upload(objectPath, output, {
        contentType: 'image/png',
        upsert: false,
        cacheControl: '60',
      })
    if (stored.error)
      return reply(origin, 503, { error: 'Image was not saved' })
    const saved = await auth.admin
      .from('project_images')
      .insert({ id, user_id: auth.user.id, project_id: pid, path: objectPath })
    if (saved.error) {
      await auth.admin.storage.from('project-files').remove([objectPath])
      return reply(origin, 503, { error: 'Image record was not saved' })
    }
    return reply(origin, 200, { saved: true })
  } catch {
    return reply(origin, 503, { error: 'Project image service unavailable' })
  }
})
