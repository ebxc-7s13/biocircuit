import { readFileSync, copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Static hosts without header/rewrite support (GitHub Pages) get the reviewed
// CSP as a meta tag and a 404.html SPA fallback. frame-ancestors is invalid in
// <meta>, so it is dropped there; Netlify/Cloudflare-style hosts keep _headers.
// Static app routes (see Workbench); detail routes like /post/:id use 404.html.
const staticRoutes = [
  'feed',
  'questions',
  'explore',
  'projects',
  'journal',
  'profile',
  'collaborators',
  'settings',
  'notifications',
  'saved',
  'policies',
  'trust',
  'account/recovery',
]
const githubPages = process.env.STATIC_HOST === 'github-pages'
const pagesHosting = (): Plugin => ({
  name: 'github-pages-hosting',
  apply: 'build',
  transformIndexHtml(html) {
    const headers = readFileSync(resolve('public/_headers'), 'utf8')
    const csp = /Content-Security-Policy:\s*(.+)/.exec(headers)?.[1]
    if (!csp) throw Error('Reviewed CSP missing from public/_headers')
    const meta = csp
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d && !d.startsWith('frame-ancestors'))
      .join('; ')
    return html.replace(
      '<head>',
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="${meta}" />`,
    )
  },
  closeBundle() {
    // Pages serves /x from x.html with HTTP 200, so every static app route gets
    // its own copy; only dynamic detail routes fall back to 404.html.
    copyFileSync(resolve('dist/index.html'), resolve('dist/404.html'))
    mkdirSync(resolve('dist/account'), { recursive: true })
    for (const route of staticRoutes)
      copyFileSync(resolve('dist/index.html'), resolve(`dist/${route}.html`))
  },
})

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), ...(githubPages ? [pagesHosting()] : [])],
  build: { manifest: true },
})
