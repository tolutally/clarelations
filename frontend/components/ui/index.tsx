import React from 'react';

export const Button = React.forwardRef<HTMLButtonElement, any>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={`px-4 py-2 rounded font-medium cursor-pointer ${className || ''}`}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export const Card = ({ className, ...props }: any) => (
  <div className={`rounded-lg border ${className || ''}`} {...props} />
);

export const CardHeader = ({ className, ...props }: any) => (
  <div className={`p-6 border-b ${className || ''}`} {...props} />
);

export const CardTitle = ({ className, ...props }: any) => (
  <h2 className={`text-lg font-semibold ${className || ''}`} {...props} />
);

export const CardContent = ({ className, ...props }: any) => (
  <div className={`p-6 ${className || ''}`} {...props} />
);

export const Badge = ({ variant, className, ...props }: any) => (
  <span className={`px-3 py-1 rounded-full text-sm font-medium ${className || ''}`} {...props} />
);

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

export const Label = ({ className, ...props }: any) => (
  <label className={`block text-sm font-medium mb-1 ${className || ''}`} {...props} />
);

export const Select = ({ children, value, onValueChange }: any) => (
  <div data-value={value}>
    {React.Children.map(children, (child) =>
      React.cloneElement(child as React.ReactElement, { value, onValueChange })
    )}
  </div>
);

export const SelectTrigger = ({ children, className }: any) => (
  <button className={`px-3 py-2 border rounded-md ${className || ''}`}>{children}</button>
);

export const SelectContent = ({ children }: any) => (
  <div className="border rounded-md bg-white shadow-lg">{children}</div>
);

export const SelectItem = ({ value, children }: any) => (
  <div className="px-3 py-2 cursor-pointer hover:bg-gray-100" data-value={value}>
    {children}
  </div>
);

export const SelectValue = ({ placeholder }: any) => (
  <span className="text-gray-500">{placeholder || 'Select...'}</span>
);

export const Skeleton = ({ className }: any) => (
  <div className={`bg-gray-200 animate-pulse ${className || ''}`} />
);

export const Table = ({ children }: any) => (
  <table className="w-full">{children}</table>
);

export const TableHeader = ({ children }: any) => (
  <thead>{children}</thead>
);

export const TableBody = ({ children }: any) => (
  <tbody>{children}</tbody>
);

export const TableRow = ({ children, ...props }: any) => (
  <tr {...props}>{children}</tr>
);

export const TableHead = ({ children, className }: any) => (
  <th className={`text-left p-4 ${className || ''}`}>{children}</th>
);

export const TableCell = ({ children, className }: any) => (
  <td className={`p-4 ${className || ''}`}>{children}</td>
);

export const Sheet = ({ open, onOpenChange, children }: any) => (
  open ? <div className="fixed inset-0 z-50 bg-black/50">{children}</div> : null
);

export const SheetContent = ({ children, className }: any) => (
  <div className={`fixed right-0 top-0 bottom-0 w-96 bg-white shadow-lg ${className || ''}`}>
    {children}
  </div>
);

export const SheetHeader = ({ children }: any) => (
  <div className="p-6 border-b">{children}</div>
);

export const SheetTitle = ({ children }: any) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);

export const SheetClose = ({ asChild, ...props }: any) => (
  <button className="text-gray-500 hover:text-gray-700" {...props}>✕</button>
);

export const Dialog = ({ open, onOpenChange, children }: any) => (
  open ? <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">{children}</div> : null
);

export const DialogContent = ({ children, className }: any) => (
  <div className={`bg-white rounded-lg p-6 max-w-md w-full ${className || ''}`}>
    {children}
  </div>
);

export const DialogHeader = ({ children }: any) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle = ({ children }: any) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);

export const DialogClose = ({ asChild, ...props }: any) => (
  <button className="text-gray-500 hover:text-gray-700" {...props}>✕</button>
);

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
