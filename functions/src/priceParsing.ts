import type { CheerioAPI } from 'cheerio'

const CURRENCY_SYMBOLS: Record<string, string> = { '$': 'USD', '£': 'GBP', '€': 'EUR', '¥': 'JPY', '₹': 'INR', 'C$': 'CAD', 'A$': 'AUD' }

function parseNumeric(text: string): number | null {
  const cleaned = text.replace(/[^0-9.,]/g, '')
  if (!cleaned) return null
  // Handle "1,234.56" vs "1.234,56" formats by assuming the last separator is the decimal point.
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  let normalized = cleaned
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = cleaned.replace(/,/g, '')
  }
  const value = parseFloat(normalized)
  return Number.isFinite(value) ? value : null
}

function detectCurrencySymbol(text: string): string | null {
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(symbol)) return code
  }
  return null
}

/** Best-effort price extraction: explicit og/product meta tags first, then JSON-LD, then common CSS patterns. */
export function extractPrice(
  $: CheerioAPI,
  metaAmount: string | null,
  metaCurrency: string | null
): { price: number | null; currency: string | null } {
  if (metaAmount) {
    const price = parseNumeric(metaAmount)
    if (price != null) return { price, currency: metaCurrency ?? 'USD' }
  }

  // JSON-LD structured data (schema.org Product/Offer)
  const ldNodes = $('script[type="application/ld+json"]')
  for (let i = 0; i < ldNodes.length; i++) {
    try {
      const raw = $(ldNodes[i]).contents().text()
      const parsed = JSON.parse(raw)
      const found = findPriceInJsonLd(parsed)
      if (found) return found
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }

  // Common on-page price selectors used across most storefronts (Amazon, Shopify, WooCommerce, etc.)
  const selectors = [
    '.a-price .a-offscreen',
    '[data-a-color="price"] .a-offscreen',
    '[itemprop="price"]',
    '.price .amount',
    '.product-price',
    '.price',
  ]
  for (const sel of selectors) {
    const text = $(sel).first().text().trim()
    if (text) {
      const price = parseNumeric(text)
      if (price != null) return { price, currency: detectCurrencySymbol(text) ?? 'USD' }
    }
  }

  return { price: null, currency: null }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findPriceInJsonLd(node: any): { price: number; currency: string | null } | null {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findPriceInJsonLd(item)
      if (found) return found
    }
    return null
  }
  const offers = node.offers ?? node['@graph']
  if (offers) {
    const found = findPriceInJsonLd(offers)
    if (found) return found
  }
  if (node.price != null) {
    const price = parseNumeric(String(node.price))
    if (price != null) return { price, currency: node.priceCurrency ?? null }
  }
  return null
}
