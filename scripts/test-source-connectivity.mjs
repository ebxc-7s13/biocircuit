import { writeFile } from 'node:fs/promises'
// Two bounded public metadata requests, without private contact or credentials.
// This is upstream availability only, never hosted member/cache acceptance.
const checks = []
for (const [source, url, validate] of [
  [
    'Crossref',
    'https://api.crossref.org/works/10.1038/nphys1170',
    (x) =>
      x.message?.DOI === '10.1038/nphys1170' && Boolean(x.message?.title?.[0]),
  ],
  [
    'PubMed',
    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=19304878&retmode=json&tool=biocircuit',
    (x) =>
      x.result?.['19304878']?.uid === '19304878' &&
      Boolean(x.result?.['19304878']?.title),
  ],
]) {
  const start = performance.now()
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const valid = response.ok && validate(await response.json())
    checks.push({
      source,
      httpStatus: response.status,
      canonicalMetadataPresent: valid,
      passed: valid,
      elapsedMs: Math.round(performance.now() - start),
    })
  } catch {
    checks.push({
      source,
      passed: false,
      error: 'Provider request unavailable',
    })
  }
}
const report = {
  scope:
    'LIVE upstream public metadata connectivity only; no application cache, authenticated member search, full text or synthetic hits',
  checks,
}
const file = `docs/verification/cloud/source-connectivity-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
await writeFile(file, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ file, ...report }))
if (checks.some((x) => !x.passed)) process.exitCode = 1
