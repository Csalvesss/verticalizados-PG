interface Props {
  src: string;
  size?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Avatar({ src, size = 40, onClick, style }: Props) {
  return (
    <img
      src={src || 'https://i.pravatar.cc/150?img=12'}
      alt=""
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
