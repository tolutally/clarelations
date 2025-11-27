import React from 'react';

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

export default Card;
