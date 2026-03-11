interface Props {
  src: string | null | undefined;
  name?: string;
  size?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

function initialsAvatar(name: string, size: number): string {
  const initial = (name || '?').charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#1a1a2e"/><text x="${size / 2}" y="${size * 0.67}" text-anchor="middle" font-size="${size * 0.44}" font-family="Barlow,sans-serif" font-weight="700" fill="#F07830">${initial}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function Avatar({ src, name = '?', size = 40, onClick, style }: Props) {
  const fallback = initialsAvatar(name, size);

  return (
    <img
      src={src || fallback}
      alt=""
      onClick={onClick}
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallback; }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        backgroundColor: '#1a1a2e',
        ...style,
      }}
    />
  );
}
