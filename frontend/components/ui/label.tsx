import React from 'react';

export const Label = ({ className, ...props }: any) => (
  <label className={`block text-sm font-medium mb-1 ${className || ''}`} {...props} />
);

export default Label;
