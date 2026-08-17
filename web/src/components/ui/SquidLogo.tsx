/**
 * The Squids-GiftList mark. Using the real 🦑 emoji glyph rather than hand-drawn vector paths:
 * at the small sizes this renders at (an 18-32px badge), custom line art loses its silhouette and
 * stops reading as "squid" — the emoji is already a well-drawn, recognizable icon at any size,
 * and happens to already be purple/pink in most platforms' emoji sets.
 */
export function SquidLogo({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={className}
      role="img"
      aria-label="Squid"
      style={{ fontSize: size, lineHeight: 1, display: 'inline-block' }}
    >
      🦑
    </span>
  )
}
