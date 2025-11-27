import React from 'react';

export const Skeleton = ({ className }: any) => (
  <div className={`bg-gray-200 animate-pulse ${className || ''}`} />
);

export default Skeleton;
