import { getPalette } from './data';
import type { Theme } from './types';

interface PlaceholderArtProps {
  idx: number;
  theme: Theme;
}

export function PlaceholderArt({ idx, theme }: PlaceholderArtProps) {
  const [bg, mid, fg] = getPalette(theme, idx);
  const kind = idx % 6;
  const gradId = `g${idx}`;
  const patternId = `s${idx}`;

  return (
    <svg
      viewBox="0 0 220 300"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bg} />
          <stop offset="100%" stopColor={mid} />
        </linearGradient>
        <pattern
          id={patternId}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${idx * 17})`}
        >
          <rect width="6" height="6" fill="transparent" />
          <line x1="0" y1="0" x2="0" y2="6" stroke={fg} strokeOpacity="0.18" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="220" height="300" fill={`url(#${gradId})`} />
      <rect width="220" height="300" fill={`url(#${patternId})`} />

      {kind === 0 && <circle cx="110" cy="130" r="64" fill={fg} opacity="0.85" />}
      {kind === 1 && <rect x="40" y="70" width="140" height="140" fill={fg} opacity="0.85" />}
      {kind === 2 && <polygon points="110,52 178,200 42,200" fill={fg} opacity="0.85" />}
      {kind === 3 && (
        <g opacity="0.9">
          <circle cx="80" cy="120" r="48" fill={fg} />
          <circle cx="150" cy="160" r="48" fill={fg} opacity="0.6" />
        </g>
      )}
      {kind === 4 && (
        <g opacity="0.85">
          <rect x="30" y="60" width="50" height="180" fill={fg} />
          <rect x="90" y="100" width="50" height="140" fill={fg} opacity="0.7" />
          <rect x="150" y="140" width="40" height="100" fill={fg} opacity="0.5" />
        </g>
      )}
      {kind === 5 && (
        <g opacity="0.9">
          <path d="M0,180 Q55,120 110,180 T220,180 L220,300 L0,300 Z" fill={fg} />
        </g>
      )}
    </svg>
  );
}