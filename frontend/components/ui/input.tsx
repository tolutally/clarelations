import React from 'react';

export const Input = React.forwardRef<HTMLInputElement, any>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={`px-3 py-2 border rounded-md ${className || ''}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export default Input;
