import { ADMIN_EMAIL } from '../constants';
import type { RepostOf } from '../types';

interface Props {
  repostOf: RepostOf;
}

const verifiedBadge = (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#F07830', flexShrink: 0 }}>
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z" />
  </svg>
);

export function RepostBlock({ repostOf }: Props) {
  const isVerified = repostOf.userEmail === ADMIN_EMAIL;

  return (
    <div style={{
      borderRadius: 16,
      border: '1px solid #2f3336',
      padding: 12,
      marginTop: 8,
      marginBottom: 12,
      background: 'rgba(255, 255, 255, 0.02)',
    }}>
      {/* Original author header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
      }}>
        <span style={{
          fontWeight: 700,
          color: '#fff',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          fontFamily: 'Barlow, sans-serif',
        }}>
          {repostOf.user}
          {isVerified && verifiedBadge}
        </span>
      </div>

      {/* Original post text */}
      {repostOf.text && (
        <p style={{
          fontSize: 14,
          color: '#e7e9ea',
          lineHeight: 1.5,
          margin: 0,
          marginBottom: repostOf.imageUrl ? 8 : 0,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          fontFamily: 'Barlow, sans-serif',
        }}>
          {repostOf.text}
        </p>
      )}

      {/* Original post image */}
      {repostOf.imageUrl && (
        <div style={{
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #2f3336',
          marginTop: repostOf.text ? 0 : 0,
        }}>
          <img
            src={repostOf.imageUrl}
            alt=""
            style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
    </div>
  );
}
