import React from 'react';

export const Badge = ({ variant, className, ...props }: any) => (
  <span className={`px-3 py-1 rounded-full text-sm font-medium ${className || ''}`} {...props} />
);

export default Badge;
