/**
 * 쿨링오프 브랜드 로고 (SVG 6각 결정).
 *
 * prototype/utils.jsx 의 SnowflakeLogo 와 동일.
 * 유니코드 ❄ 는 폰트/플랫폼별 렌더링 편차가 커서 SVG 로 통일.
 */
export default function SnowflakeLogo({
  size = 18,
  color = 'var(--accent)',
}: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden
    >
      <rect x="11.2" y="1.5" width="1.6" height="21" rx="0.8" />
      <rect x="11.2" y="1.5" width="1.6" height="21" rx="0.8" transform="rotate(60 12 12)" />
      <rect x="11.2" y="1.5" width="1.6" height="21" rx="0.8" transform="rotate(120 12 12)" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 12 12)`}>
          <polygon points="12,0.5 13.2,1.5 12,2.5 10.8,1.5" />
          <g transform="translate(12 4.5)">
            <rect x="-0.7" y="-4" width="1.4" height="4" rx="0.7" transform="rotate(-60)" />
            <rect x="-0.7" y="-4" width="1.4" height="4" rx="0.7" transform="rotate(60)" />
          </g>
        </g>
      ))}
      <circle cx="12" cy="12" r="2.3" />
    </svg>
  )
}
