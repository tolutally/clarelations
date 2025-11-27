import React from 'react';

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

export default Table;
