import React from 'react';

export const Badge = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  style = {},
}) => {
  const variantClass = variant !== 'default' ? `badge-${variant}` : '';
  const sizeClass = size === 'sm' ? 'badge-sm' : '';

  return (
    <span
      className={`badge ${variantClass} ${sizeClass} ${className}`.trim()}
      style={style}
    >
      {children}
    </span>
  );
};
