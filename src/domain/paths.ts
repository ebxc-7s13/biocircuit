// The app may be served below a path prefix (e.g. GitHub Pages /biocircuit/).
// BASE_URL always ends with '/'; '/' when served from the domain root.
export const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
export const appPath = (path: string) =>
  basePath + '/' + path.replace(/^\//, '')
