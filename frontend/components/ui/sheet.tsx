import React from 'react';

export const Sheet = ({ open, onOpenChange, children }: any) => {
  console.log('Sheet render:', { open, hasChildren: !!children });
  
  if (!open) {
    console.log('Sheet: not open, returning null');
    return null;
  }
  
  console.log('Sheet: rendering overlay and content');
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      onClick={() => onOpenChange?.(false)}
    >
      {children}
    </div>
  );
};

export const SheetContent = ({ children, className }: any) => (
  <div 
    className={`fixed right-4 top-4 bottom-4 w-[480px] bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${className || ''}`}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </div>
);

export const SheetHeader = ({ children, className }: any) => (
  <div className={`px-8 pt-8 pb-6 border-b border-gray-100 flex-shrink-0 ${className || ''}`}>
    {children}
  </div>
);

export const SheetTitle = ({ children, className }: any) => (
  <h2 className={`text-lg font-semibold ${className || ''}`}>{children}</h2>
);

export const SheetDescription = ({ children, className }: any) => (
  <p className={`text-sm text-gray-500 mt-2 ${className || ''}`}>{children}</p>
);

export const SheetClose = ({ asChild, ...props }: any) => (
  <button className="text-gray-500 hover:text-gray-700" {...props}>✕</button>
);

export default Sheet;
