import React, { useState, useRef, useEffect } from 'react';

export const Select = ({ children, value, onValueChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find the label for the selected value from SelectItem children
  let selectedLabel = value;
  React.Children.forEach(children, (child: any) => {
    if (child?.type === SelectContent || child?.type?.name === 'SelectContent') {
      React.Children.forEach(child.props.children, (item: any) => {
        if (item?.props?.value === value) {
          selectedLabel = item.props.children;
        }
      });
    }
  });

  return (
    <div ref={selectRef} className="relative">
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement, {
          value,
          selectedLabel,
          onValueChange,
          isOpen,
          setIsOpen,
        })
      )}
    </div>
  );
};

export const SelectTrigger = ({ children, className, isOpen, setIsOpen, selectedLabel }: any) => (
  <button
    type="button"
    className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    onClick={() => setIsOpen?.(!isOpen)}
  >
    {React.Children.map(children, (child) =>
      child?.type === SelectValue || child?.type?.name === 'SelectValue'
        ? React.cloneElement(child as React.ReactElement, { selectedLabel })
        : child
    )}
    <svg
      className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
);

export const SelectContent = ({ children, isOpen, value, onValueChange, setIsOpen, className }: any) =>
  isOpen ? (
    <div className={`absolute z-[9999] mt-1 max-h-80 w-full min-w-max overflow-y-auto rounded-md border border-slate-200 bg-white shadow-2xl ${className || ''}`}>
      <div className="p-1">
        {React.Children.map(children, (child) =>
          React.cloneElement(child as React.ReactElement, {
            currentValue: value,
            onValueChange,
            setIsOpen,
          })
        )}
      </div>
    </div>
  ) : null;

export const SelectItem = ({ value, children, currentValue, onValueChange, setIsOpen }: any) => {
  const isSelected = value === currentValue;
  
  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 ${
        isSelected ? 'bg-slate-100 font-medium' : ''
      }`}
      onClick={() => {
        onValueChange?.(value);
        setIsOpen?.(false);
      }}
    >
      {children}
      {isSelected && (
        <span className="ml-auto">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </div>
  );
};

export const SelectValue = ({ placeholder, value, selectedLabel }: any) => {
  const displayValue = selectedLabel || value;
  const shouldShowPlaceholder = !displayValue || displayValue === 'all';
  
  return (
    <span className={shouldShowPlaceholder ? 'text-slate-500' : ''}>
      {shouldShowPlaceholder ? placeholder : displayValue}
    </span>
  );
};

export default Select;
