import React from 'react';
import { useLoadAction } from '@quibakery/data';
import loadDeals from '../actions/loadDeals';
import DealsBoard from './DealsBoard';

export type DealsBoardContainerProps = {
  onViewDeal: (dealId: string) => void;
};

export function DealsBoardContainer({ onViewDeal }: DealsBoardContainerProps) {
  const { data: deals, loading, error, refresh } = useLoadAction(loadDeals, []);

  if (loading) {
    return <div className="w-full p-8 pt-20 text-center">Loading deals...</div>;
  }

  if (error) {
    return <div className="w-full p-8 pt-20 text-center text-red-500">Error loading deals: {error.message}</div>;
  }

  return <DealsBoard deals={deals || []} onDealUpdated={refresh} onViewDeal={onViewDeal} />;
}
