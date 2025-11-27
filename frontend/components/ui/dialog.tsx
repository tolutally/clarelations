import React from 'react';

export const Dialog = ({ open, onOpenChange, children }: any) => {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) {
          onOpenChange?.(false);
        }
      }}
      onKeyDown={(e) => {
        // Close on ESC key
        if (e.key === 'Escape') {
          onOpenChange?.(false);
        }
      }}
    >
      {children}
    </div>
  );
};

export const DialogContent = ({ children, className }: any) => (
  <div 
    className={`bg-white rounded-lg p-6 max-w-md w-full ${className || ''}`}
    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
  >
    {children}
  </div>
);

export const DialogHeader = ({ children }: any) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle = ({ children }: any) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);

export const DialogDescription = ({ children, className }: any) => (
  <p className={`text-sm text-gray-500 mt-2 ${className || ''}`}>{children}</p>
);

export const DialogClose = ({ asChild, ...props }: any) => (
  <button className="text-gray-500 hover:text-gray-700" {...props}>✕</button>
);

export default Dialog;
