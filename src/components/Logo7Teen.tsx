interface Logo7TeenProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}

const sizes = {
  sm: { fontSize: 20 },
  md: { fontSize: 28 },
  lg: { fontSize: 42 },
  xl: { fontSize: 64 },
};

export function Logo7Teen({ size = 'md', style = {} }: Logo7TeenProps) {
  const { fontSize } = sizes[size];
  return (
    <span style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: 900,
      letterSpacing: -1,
      lineHeight: 1,
      fontSize,
      ...style,
    }}>
      <span style={{ color: '#BA7517' }}>7</span>
      <span style={{ color: '#e7e9ea' }}>Teen</span>
    </span>
  );
}
