import { HttpsError } from 'firebase-functions/v2/https'
import dns from 'node:dns/promises'
import net from 'node:net'

/**
 * Blocks the classic SSRF escape hatches before we let a Cloud Function fetch a
 * user-supplied URL: non-http(s) schemes, loopback/private/link-local addresses
 * (including ones a hostname might resolve to), and obvious metadata-service hosts.
 */
export async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new HttpsError('invalid-argument', 'That link does not look like a valid URL.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new HttpsError('invalid-argument', 'Only http/https links are supported.')
  }

  const hostname = url.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
    throw new HttpsError('invalid-argument', 'That URL is not allowed.')
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new HttpsError('invalid-argument', 'That URL is not allowed.')
    }
    return url
  }

  let addresses: string[]
  try {
    const records = await dns.lookup(hostname, { all: true })
    addresses = records.map((r) => r.address)
  } catch {
    throw new HttpsError('invalid-argument', "Couldn't resolve that domain.")
  }

  if (addresses.length === 0 || addresses.some(isPrivateOrReservedIp)) {
    throw new HttpsError('invalid-argument', 'That URL is not allowed.')
  }

  return url
}

function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase()
    return lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('::ffff:127.')
  }
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true
  const [a, b] = parts
  if (a === 10) return true
  if (a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 0) return true
  if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
  return false
}
