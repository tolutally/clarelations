import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Mail, CheckCircle2, Clock, AlertCircle, RefreshCw, Settings, Info, XCircle, TrendingUp, UserPlus, LogOut, Users } from 'lucide-react';
import PendingDeals from './PendingDeals';
import { useAuth } from '@/contexts/AuthContext';

interface GmailStatus {
  isConnected: boolean;
  connectedAt: string | null;
  autoSyncEnabled?: boolean;
  lastSync: {
    startedAt: string;
    completedAt: string;
    duration: number;
    messagesProcessed: number;
    dealsCreated: number;
    dealsUpdated: number;
    contactsCreated: number;
    contactsUpdated: number;
    pendingReview: number;
    rejected: number;
    errors: number;
    status: 'running' | 'completed' | 'failed';
    errorMessage?: string;
  } | null;
  pendingReviewCount: number;
  statistics: {
    totalSyncs: number;
    totalDealsCreated: number;
    totalContactsCreated: number;
    avgProcessingTime: number;
  };
  recentSyncs: Array<{
    startedAt: string;
    status: string;
    dealsCreated: number;
    duration: number;
  }>;
}

interface GmailAccount {
  id: string;
  email: string;
  connectedAt: string;
  isPrimary: boolean;
  lastSync: string | null;
}

export function GmailSyncSettings() {
  const { session } = useAuth();
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [pendingDeals, setPendingDeals] = useState<any[]>([]);
  const [pendingDealsLoading, setPendingDealsLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log('📊 Gmail status fetched:', data);
      setStatus(data);
    } catch (error) {
      console.error('❌ Error fetching status:', error);
      // Set default disconnected status when API is not available
      setStatus({
        isConnected: false,
        connectedAt: null,
        autoSyncEnabled: false,
        lastSync: null,
        pendingReviewCount: 0,
        statistics: {
          totalSyncs: 0,
          totalDealsCreated: 0,
          totalContactsCreated: 0,
          avgProcessingTime: 0,
        },
        recentSyncs: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/accounts`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('❌ Error fetching Gmail accounts:', error);
      setAccounts([]);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/connect`);
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Google OAuth URL
        window.location.href = data.authUrl;
      } else {
        console.error('❌ No auth URL received:', data);
        setConnecting(false);
      }
    } catch (error) {
      console.error('❌ Error initiating Gmail connection:', error);
      setConnecting(false);
    }
  };

  const handleConnectAdditional = async () => {
    setConnecting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/connect-additional`);
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Google OAuth URL for additional account
        window.location.href = data.authUrl;
      } else {
        console.error('❌ No auth URL received for additional account:', data);
        setConnecting(false);
      }
    } catch (error) {
      console.error('❌ Error connecting additional Gmail account:', error);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Gmail account? This will stop all email syncing.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/disconnect`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchStatus();
        await fetchAccounts();
        console.log('✅ Gmail account disconnected successfully');
      } else {
        console.error('❌ Failed to disconnect Gmail account');
      }
    } catch (error) {
      console.error('❌ Error disconnecting Gmail account:', error);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSync = async () => {
    if (!session?.access_token) {
      console.error('❌ No authentication token available');
      return;
    }
    
    setSyncing(true);
    setSyncResults(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      console.log('🔄 Sync completed:', data);
      setSyncResults(data);
      await fetchStatus();
      await fetchPendingDeals();
    } catch (error) {
      console.error('❌ Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleAutoSyncToggle = async (enabled: boolean) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/auto-sync`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });
      
      if (response.ok) {
        await fetchStatus();
      } else {
        console.error('Failed to update auto-sync setting');
      }
    } catch (error) {
      console.error('Error updating auto-sync setting:', error);
    }
  };

  // Fetch pending deals
  const fetchPendingDeals = async () => {
    if (!session?.access_token) {
      console.log('⚠️ No authentication token, skipping pending deals fetch');
      return;
    }
    
    console.log('🔍 Fetching pending deals...');
    setPendingDealsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/gmail/pending-deals`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      console.log('📊 Pending deals response status:', response.status);
      const data = await response.json();
      console.log('📋 Pending deals data:', data);
      setPendingDeals(data.pendingDeals || []);
    } catch (error) {
      console.error('❌ Error fetching pending deals:', error);
      // Set empty array on error so UI still shows
      setPendingDeals([]);
    } finally {
      setPendingDealsLoading(false);
    }
  };

  // Handle deal approval
  const handleApproveDeal = async (deal: any) => {
    if (!session?.access_token) {
      console.error('❌ No authentication token available');
      return;
    }
    
    setPendingDealsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/gmail/approve-deal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ pendingDeal: deal })
      });

      const data = await response.json();
      if (data.success) {
        setPendingDeals(prev => prev.filter(d => d.id !== deal.id));
        await fetchStatus();
        console.log('Deal approved and created successfully');
      } else {
        console.error('Failed to create deal:', data.error);
      }
    } catch (error) {
      console.error('Error approving deal:', error);
    } finally {
      setPendingDealsLoading(false);
    }
  };

  // Handle deal rejection
  const handleRejectDeal = async (dealId: string) => {
    if (!session?.access_token) {
      console.error('❌ No authentication token available');
      return;
    }
    
    setPendingDealsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/gmail/reject-deal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ pendingDealId: dealId })
      });

      const data = await response.json();
      if (data.success) {
        setPendingDeals(prev => prev.filter(d => d.id !== dealId));
        console.log('Deal rejected successfully');
      } else {
        console.error('Failed to reject deal:', data.error);
      }
    } catch (error) {
      console.error('Error rejecting deal:', error);
    } finally {
      setPendingDealsLoading(false);
    }
  };

  const getNextSyncTime = () => {
    if (!status?.autoSyncEnabled) return 'Not scheduled (auto-sync disabled)';
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2:00 AM UTC
    return tomorrow.toLocaleString();
  };

  useEffect(() => {
    if (session?.access_token) {
      fetchStatus();
      fetchAccounts();
      
      // Check for OAuth callback parameters
      const urlParams = new URLSearchParams(window.location.search);
      const gmailAuth = urlParams.get('gmail_auth');
      
      if (gmailAuth === 'success') {
        // Remove the URL parameter and refresh status
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          fetchStatus();
          fetchAccounts();
        }, 1000);
      }
    }
  }, [session]);

  useEffect(() => {
    // Fetch pending deals when session is available
    if (session?.access_token) {
      fetchPendingDeals();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="w-7 h-7 text-blue-600" />
            Gmail Integration
          </h2>
          <p className="text-gray-600 mt-2 text-lg">
            Automatically extract deals and contacts from email conversations using AI
          </p>
        </div>
        {status && (
          <div className="flex items-center space-x-3">
            <Badge 
              variant={status.isConnected ? "default" : "secondary"}
              className={status.isConnected 
                ? "bg-green-100 text-green-800 border-green-200 px-3 py-1" 
                : "bg-gray-100 text-gray-600 border-gray-200 px-3 py-1"
              }
            >
              {status.isConnected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Connected ({accounts.length} account{accounts.length !== 1 ? 's' : ''})
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
            <div className="flex gap-2">
              {status.isConnected ? (
                <>
                  <Button 
                    onClick={handleSync} 
                    disabled={syncing}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleConnectAdditional}
                    disabled={connecting || accounts.length >= 5}
                    variant="outline"
                    size="sm"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Account
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {disconnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Disconnect
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleConnect} 
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Connect Gmail
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Connection prompt */}
      {status && !status.isConnected && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Gmail Integration</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg leading-relaxed">
              Gmail integration allows automatic detection and extraction of deals from email conversations using AI.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center text-amber-800 mb-2">
                <Info className="w-5 h-5 mr-2" />
                <span className="font-medium">Gmail API Not Available</span>
              </div>
              <p className="text-sm text-amber-700">
                Gmail integration requires additional backend setup. Contact your administrator to enable this feature.
              </p>
            </div>
            <Button 
              onClick={handleConnect} 
              disabled={true}
              size="lg"
              className="bg-gray-400 cursor-not-allowed px-8 py-3"
            >
              <Mail className="w-5 h-5 mr-2" />
              Gmail Integration Unavailable
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connected state */}
      {status && status.isConnected && (
        <div className="space-y-6">
          {/* Connected Accounts */}
          {accounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Connected Accounts ({accounts.length})
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Gmail accounts connected for email syncing
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{account.email}</span>
                            {account.isPrimary && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Connected {new Date(account.connectedAt).toLocaleDateString()}
                            {account.lastSync && (
                              <span> • Last sync: {new Date(account.lastSync).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                        {!account.isPrimary && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              // TODO: Implement individual account disconnect
                              console.log('Disconnect account:', account.id);
                            }}
                          >
                            <LogOut className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {accounts.length < 5 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                        <div>
                          <span className="font-medium text-blue-900">Add another Gmail account</span>
                          <p className="text-sm text-blue-700">Sync emails from multiple Gmail accounts</p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleConnectAdditional}
                        disabled={connecting}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {connecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Add Account'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Statistics Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Sync Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {syncResults?.dealsCreated || status?.statistics?.totalDealsCreated || '0'}
                  </div>
                  <div className="text-sm font-medium text-blue-800">Deals Created</div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {syncResults?.contactsCreated || status?.statistics?.totalContactsCreated || '0'}
                  </div>
                  <div className="text-sm font-medium text-green-800">Contacts Added</div>
                </div>
                <div className="text-center p-6 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="text-4xl font-bold text-orange-600 mb-2">
                    {pendingDeals?.length || '0'}
                  </div>
                  <div className="text-sm font-medium text-orange-800">Pending Review</div>
                </div>
              </div>

              {/* Sync Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Last sync</span>
                    <span className="text-sm text-gray-600">
                      {status?.lastSync 
                        ? new Date(status.lastSync.completedAt || status.lastSync.startedAt).toLocaleString() 
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total syncs</span>
                    <span className="text-sm text-gray-600">{status.statistics?.totalSyncs || 0}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Auto-sync</span>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={status.autoSyncEnabled || false}
                        onChange={(e) => handleAutoSyncToggle(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">
                        {status.autoSyncEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Next sync</span>
                    <span className="text-sm text-gray-600">{getNextSyncTime()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Deals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Pending Deals Review
                {pendingDeals.length > 0 && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {pendingDeals.length} pending
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600">
                AI-detected deals waiting for your approval before being added to your deal board
              </p>
            </CardHeader>
            <CardContent>
              <PendingDeals
                pendingDeals={pendingDeals}
                onApproveDeal={handleApproveDeal}
                onRejectDeal={handleRejectDeal}
                isLoading={pendingDealsLoading}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default GmailSyncSettings;