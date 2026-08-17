import { HttpsError } from 'firebase-functions/v2/https'

const MAX_BYTES = 3 * 1024 * 1024 // 3MB is plenty for a product page's HTML
const TIMEOUT_MS = 10_000

/** Fetches a URL's HTML with a realistic browser UA, a size cap, and a timeout. */
export async function fetchHtml(url: URL, extraHeaders: Record<string, string> = {}): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...extraHeaders,
      },
    })

    if (!res.ok) {
      throw new HttpsError('failed-precondition', `The page responded with an error (${res.status}). It may require you to be logged in, or the link may be wrong.`)
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new HttpsError('failed-precondition', "That link doesn't point to a normal web page.")
    }

    const contentLength = Number(res.headers.get('content-length') ?? 0)
    if (contentLength > MAX_BYTES) {
      throw new HttpsError('failed-precondition', 'That page is too large to read.')
    }

    const reader = res.body?.getReader()
    if (!reader) return await res.text()

    const chunks: Uint8Array[] = []
    let received = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      if (received > MAX_BYTES) {
        await reader.cancel()
        throw new HttpsError('failed-precondition', 'That page is too large to read.')
      }
      chunks.push(value)
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf-8')
  } catch (err) {
    if (err instanceof HttpsError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new HttpsError('deadline-exceeded', 'That page took too long to respond.')
    }
    throw new HttpsError('unavailable', "Couldn't reach that page. Double-check the link and try again.")
  } finally {
    clearTimeout(timeout)
  }
}
