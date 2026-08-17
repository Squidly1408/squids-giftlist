import * as cheerio from 'cheerio'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { assertSafeExternalUrl } from './urlSafety'
import { fetchHtml } from './fetchHtml'
import { extractPrice } from './priceParsing'
import { requireRealAccount } from './authGuard'

export interface LinkPreviewResult {
  name: string
  imageUrl: string | null
  price: number | null
  currency: string | null
  siteName: string | null
  url: string
}

function meta($: cheerio.CheerioAPI, ...selectors: string[]): string | null {
  for (const sel of selectors) {
    const val = $(sel).attr('content')
    if (val && val.trim()) return val.trim()
  }
  return null
}

export const linkPreview = onCall<{ url: string }, Promise<LinkPreviewResult>>(
  { cors: true, timeoutSeconds: 30, memory: '256MiB' },
  async (request) => {
    requireRealAccount(request)

    const rawUrl = request.data?.url
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new HttpsError('invalid-argument', 'A URL is required.')
    }

    const url = await assertSafeExternalUrl(rawUrl)
    const html = await fetchHtml(url)
    const $ = cheerio.load(html)

    const name =
      meta($, 'meta[property="og:title"]', 'meta[name="twitter:title"]') ?? $('title').first().text().trim() ?? 'Untitled gift'

    const imageUrl = meta($, 'meta[property="og:image:secure_url"]', 'meta[property="og:image"]', 'meta[name="twitter:image"]')

    const siteName = meta($, 'meta[property="og:site_name"]') ?? url.hostname.replace(/^www\./, '')

    const { price, currency } = extractPrice($, meta($, 'meta[property="product:price:amount"]', 'meta[property="og:price:amount"]'), meta($, 'meta[property="product:price:currency"]', 'meta[property="og:price:currency"]'))

    return {
      name: name.slice(0, 200),
      imageUrl: imageUrl ? new URL(imageUrl, url).toString() : null,
      price,
      currency,
      siteName,
      url: url.toString(),
    }
  }
)
