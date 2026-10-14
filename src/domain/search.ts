export function matchesSearch(
  text: string,
  query: string,
  id: string,
  result?: { query: string; ids: string[] },
) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (result?.query.toLowerCase() === q) return result.ids.includes(id)
  return q.split(/\s+/).every((term) => text.toLowerCase().includes(term))
}
