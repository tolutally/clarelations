import React from 'react';

export const Tabs = ({ value, onValueChange, children }: any) => {
  return (
    <div>
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement, { activeValue: value, onValueChange })
      )}
    </div>
  );
};

export const TabsList = ({ children, className, activeValue, onValueChange }: any) => (
  <div className={`inline-flex items-center justify-center rounded-md p-1 ${className || ''}`}>
    {React.Children.map(children, (child) =>
      React.cloneElement(child as React.ReactElement, { activeValue, onValueChange })
    )}
  </div>
);

export const TabsTrigger = ({ value, children, className, activeValue, onValueChange, ...props }: any) => {
  const isActive = value === activeValue;
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  return (
    <button
      className={`${baseClasses} ${isActive ? '' : 'text-slate-600 hover:bg-slate-100'} ${className || ''}`}
      onClick={() => onValueChange?.(value)}
      data-state={isActive ? 'active' : 'inactive'}
      {...props}
    >
      {children}
    </button>
  );
};

export default Tabs;
