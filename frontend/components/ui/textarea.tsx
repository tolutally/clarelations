import React from 'react';

export const Textarea = React.forwardRef<HTMLTextAreaElement, any>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`px-3 py-2 border rounded-md w-full ${className || ''}`}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export default Textarea;
