import * as cheerio from 'cheerio'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { assertSafeExternalUrl } from './urlSafety'
import { fetchHtml } from './fetchHtml'
import { requireRealAccount } from './authGuard'

export interface ImportedProduct {
  name: string
  url: string | null
  imageUrl: string | null
  price: number | null
  currency: string | null
}

const AMAZON_HOST_PATTERN = /(^|\.)amazon\.[a-z.]{2,10}$/i

export const importAmazonWishlist = onCall<{ url: string }, Promise<{ items: ImportedProduct[] }>>(
  { cors: true, timeoutSeconds: 30, memory: '256MiB' },
  async (request) => {
    requireRealAccount(request)

    const rawUrl = request.data?.url
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new HttpsError('invalid-argument', 'A wishlist URL is required.')
    }

    const url = await assertSafeExternalUrl(rawUrl)
    if (!AMAZON_HOST_PATTERN.test(url.hostname)) {
      throw new HttpsError('invalid-argument', 'That does not look like an amazon.com link.')
    }

    const html = await fetchHtml(url)
    const $ = cheerio.load(html)
    const items: ImportedProduct[] = []
    const seen = new Set<string>()

    // Amazon wishlist rows are rendered as <li data-itemid="..."> elements. Amazon changes this
    // markup periodically, so we try a few historically-stable selector strategies.
    const rows = $('li[data-itemid], div[data-itemid]')

    rows.each((_, el) => {
      const row = $(el)
      const itemId = row.attr('data-itemid')
      if (!itemId || seen.has(itemId)) return

      const nameEl = row.find('[id^="itemName_"], a[id^="itemName_"], h3 a, .a-link-normal').first()
      const name = (nameEl.text() || row.find('[data-title]').attr('data-title') || '').trim()
      if (!name) return

      let href = nameEl.attr('href') ?? row.find('a').first().attr('href') ?? null
      if (href) {
        try {
          href = new URL(href, url).toString()
        } catch {
          href = null
        }
      }

      const img = row.find('img').first()
      let imageUrl = img.attr('src') || img.attr('data-src') || null
      if (imageUrl) {
        try {
          imageUrl = new URL(imageUrl, url).toString()
        } catch {
          imageUrl = null
        }
      }

      const priceText = row.find('.a-price .a-offscreen, [id^="itemPrice_"], .a-price-whole').first().text().trim()
      const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : null

      seen.add(itemId)
      items.push({
        name: name.slice(0, 200),
        url: href,
        imageUrl,
        price: Number.isFinite(price) ? price : null,
        currency: 'USD',
      })
    })

    if (items.length === 0) {
      throw new HttpsError(
        'not-found',
        'No items were found. Make sure the wishlist privacy is set to "Public" and the link is a shared list link, then try again.'
      )
    }

    return { items: items.slice(0, 100) }
  }
)
