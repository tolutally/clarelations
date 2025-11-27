import React from 'react';
import { Clock, Mail, Building, DollarSign, Check, X, TrendingUp } from 'lucide-react';

interface PendingDeal {
  id: string;
  title: string;
  description: string;
  value: number;
  stage: string;
  source: string;
  contact_email: string;
  contact_name: string;
  company: string;
  confidence: number;
  email_subject: string;
  email_date: string;
  email_snippet: string;
  created_at: string;
  status: string;
}

interface PendingDealsProps {
  pendingDeals: PendingDeal[];
  onApproveDeal: (deal: PendingDeal) => Promise<void>;
  onRejectDeal: (dealId: string) => Promise<void>;
  isLoading?: boolean;
}

const PendingDeals: React.FC<PendingDealsProps> = ({
  pendingDeals,
  onApproveDeal,
  onRejectDeal,
  isLoading = false
}) => {
  console.log('🎯 PendingDeals component rendered with:', { 
    pendingDealsCount: pendingDeals?.length || 0, 
    isLoading,
    pendingDeals: pendingDeals 
  });
  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'No value specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'text-green-600 bg-green-50';
    if (confidence >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (pendingDeals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Deals</h3>
        <p className="text-gray-600 max-w-sm mx-auto">
          All AI-detected deals have been reviewed, or no potential deals were found in recent emails. 
          Try running a sync to check for new opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pendingDeals.map((deal) => (
        <div key={deal.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h4 className="text-xl font-semibold text-gray-900">{deal.title}</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(deal.confidence)}`}>
                  {deal.confidence}/10 confidence
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{deal.contact_name}</div>
                    <div className="text-gray-500">{deal.contact_email}</div>
                  </div>
                </div>
                
                {deal.company && (
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center mr-3">
                      <Building className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Company</div>
                      <div className="text-gray-500">{deal.company}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center mr-3">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium">Value</div>
                    <div className="text-gray-500">{formatCurrency(deal.value)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Email Subject:</span>
                  <div className="mt-1 text-gray-900">{deal.email_subject}</div>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Date:</span>
                  <div className="mt-1 text-gray-600">{formatDate(deal.email_date)}</div>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">AI Summary:</span>
                  <div className="mt-1 text-gray-900">{deal.description}</div>
                </div>
                {deal.email_snippet && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Email Preview:</span>
                    <div className="mt-1 p-3 bg-white rounded border text-sm text-gray-600 italic leading-relaxed">
                      "{deal.email_snippet.slice(0, 200)}..."
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              onClick={() => onRejectDeal(deal.id)}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </button>
            <button
              onClick={() => onApproveDeal(deal)}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4 mr-2" />
              Add to Deal Board
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendingDeals;