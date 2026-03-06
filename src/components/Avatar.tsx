interface Props {
  src: string | null | undefined;
  size?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Avatar({ src, size = 40, onClick, style }: Props) {
  const fallback = 'https://i.pravatar.cc/150?img=12';

  return (
    <img
      src={src || fallback}
      alt=""
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        backgroundColor: '#2f3336',
        ...style,
      }}
    />
  );
}
