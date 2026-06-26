import type { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '9999px',
  padding: '0.625rem 1.25rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  minHeight: '44px',
  cursor: 'pointer',
  border: 'none',
};

const variantStyles: Record<NonNullable<ButtonProps['variant']>, CSSProperties> = {
  primary: {
    backgroundColor: '#ffcc33',
    color: '#101014',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: '#f6f3ea',
    border: '1px solid rgba(255,255,255,0.2)',
  },
};

export function Button({
  children,
  variant = 'primary',
  style,
  ...props
}: ButtonProps) {
  return (
    <button type="button" style={{ ...baseStyle, ...variantStyles[variant], ...style }} {...props}>
      {children}
    </button>
  );
}
