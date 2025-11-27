import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Mail, CheckCircle2, Clock, AlertCircle, RefreshCw, Settings, Info, XCircle } from 'lucide-react';
import PendingDeals from './PendingDeals';

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

export function GmailSyncSettings() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [pendingDeals, setPendingDeals] = useState<any[]>([]);
  const [pendingDealsLoading, setPendingDealsLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/status`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch Gmail status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const gmailAuth = urlParams.get('gmail_auth');
    
    if (gmailAuth === 'success') {
      console.log('✅ Gmail OAuth successful - refreshing status');
      // Remove the parameter from URL without page reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('gmail_auth');
      window.history.replaceState({}, document.title, newUrl.toString());
      
      // Refresh status to show connected state
      setTimeout(fetchStatus, 1000);
    } else if (gmailAuth === 'error') {
      const errorMessage = urlParams.get('message') || 'Unknown error';
      console.error('❌ Gmail OAuth failed:', errorMessage);
      
      // Remove the parameters from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('gmail_auth');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, document.title, newUrl.toString());
      
      alert(`Gmail connection failed: ${errorMessage}`);
    }
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    console.log('🔗 Gmail connect button clicked');
    setConnecting(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/gmail/connect`;
      console.log('📡 Fetching:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('📨 Response status:', response.status);
      
      const data = await response.json();
      console.log('📄 Response data:', data);
      
      if (data.authUrl) {
        console.log('🚀 Opening OAuth window:', data.authUrl);
        // Open OAuth flow in new window
        window.open(data.authUrl, '_blank', 'width=600,height=700');
        
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          const statusResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/status`);
          const statusData = await statusResponse.json();
          
          if (statusData.isConnected) {
            clearInterval(pollInterval);
            setStatus(statusData);
            setConnecting(false);
          }
        }, 2000);
        
        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setConnecting(false);
        }, 120000);
      }
    } catch (error) {
      console.error('❌ Failed to connect Gmail:', error);
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      console.log('🔄 Manual sync triggered');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      const data = await response.json();
      console.log('✅ Sync completed:', data);
      
      setSyncResults(data);
      
      if (data.success) {
        // Refresh status
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleAutoSyncToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    
    try {
      console.log(`🔧 ${enabled ? 'Enabling' : 'Disabling'} auto-sync`);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/auto-sync`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update auto-sync setting');
      }
      
      const data = await response.json();
      console.log('✅ Auto-sync setting updated:', data);
      
      // Update local status
      setStatus(prev => ({
        ...prev,
        autoSyncEnabled: enabled
      }));
      
      // Refresh status to get updated data
      await fetchStatus();
      
    } catch (error) {
      console.error('❌ Failed to update auto-sync setting:', error);
      // Revert the toggle if the request failed
      e.target.checked = !enabled;
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

  // Fetch pending deals
  const fetchPendingDeals = async () => {
    console.log('🔍 Fetching pending deals...');
    setPendingDealsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/gmail/pending-deals`, {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      });
      console.log('📊 Pending deals response status:', response.status);
      const data = await response.json();
      console.log('📋 Pending deals data:', data);
      setPendingDeals(data.pendingDeals || []);
    } catch (error) {
      console.error('❌ Error fetching pending deals:', error);
    } finally {
      setPendingDealsLoading(false);
    }
  };

  // Handle deal approval
  const handleApproveDeal = async (deal: any) => {
    setPendingDealsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/gmail/approve-deal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify({ pendingDeal: deal })
      });

      const data = await response.json();
      if (data.success) {
        // Remove from pending deals
        setPendingDeals(prev => prev.filter(d => d.id !== deal.id));
        
        // Refresh status to update counts
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
    setPendingDealsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/gmail/reject-deal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify({ pendingDealId: dealId })
      });

      const data = await response.json();
      if (data.success) {
        // Remove from pending deals
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

  useEffect(() => {
    if (status?.isConnected) {
      fetchPendingDeals();
    }
  }, [status?.isConnected]);

  useEffect(() => {
    // Fetch pending deals on mount for demo
    fetchPendingDeals();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Gmail Integration
          </h2>
          <p className="text-gray-600 mt-1">
            Automatically extract deals from email conversations
          </p>
        </div>
        
        {!status?.isConnected ? (
          <Button onClick={handleConnect} disabled={connecting}>
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
        ) : (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              variant="outline"
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
          </div>
        )}
      </div>

      {!status?.isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Connect Your Gmail
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Authorize ClaRelations to access your Gmail account to automatically extract deals from email conversations.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Auto-approve deals</p>
                    <p className="text-gray-600">Confidence score ≥ 8</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600 font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Manual review</p>
                    <p className="text-gray-600">Confidence score 6-8</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Auto-reject</p>
                    <p className="text-gray-600">Confidence score &lt; 6</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Privacy & Data Security</p>
                    <p className="text-blue-800">
                      We only store summarized excerpts of emails related to sales conversations. Full email content is never stored.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Manual Sync Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Email Sync
                </CardTitle>
                <Button 
                  onClick={handleSync} 
                  disabled={syncing}
                  className="bg-blue-600 hover:bg-blue-700"
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
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Import deals and contacts from your Gmail conversations
              </p>
            </CardHeader>
            <CardContent>
              {/* Sync Statistics */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {syncResults?.dealsCreated || status?.statistics?.totalDealsCreated || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Deals Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {syncResults?.contactsCreated || status?.statistics?.totalContactsCreated || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Contacts Added</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {syncResults?.pendingReview || status?.pendingReviewCount || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                </div>
              </div>

              {/* Last Sync Info */}
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Last sync:</span>
                  <span>{status?.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Next auto-sync:</span>
                  <span>{getNextSyncTime()}</span>
                </div>
                {syncResults?.emailsProcessed && (
                  <div className="flex justify-between">
                    <span>Last sync processed:</span>
                    <span>{syncResults.emailsProcessed} emails</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        <>
          {/* Last Sync Status */}
          {status.lastSync && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Last Sync
                  </CardTitle>
                  <Button 
                    onClick={handleSync} 
                    disabled={syncing}
                    variant="outline"
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
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {new Date(status.lastSync.completedAt).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Messages</p>
                    <p className="text-2xl font-bold">{status.lastSync.messagesProcessed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Deals Created</p>
                    <p className="text-2xl font-bold text-green-600">{status.lastSync.dealsCreated}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Deals Updated</p>
                    <p className="text-2xl font-bold text-blue-600">{status.lastSync.dealsUpdated}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-2xl font-bold">{Math.round(status.lastSync.duration / 1000)}s</p>
                  </div>
                </div>
                
                {status.lastSync.errors > 0 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-900">{status.lastSync.errors} errors occurred</p>
                      {status.lastSync.errorMessage && (
                        <p className="text-red-700 mt-1">{status.lastSync.errorMessage}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pending Reviews */}
          {(status?.pendingReviewCount > 0 || (syncResults?.pendingReview && syncResults.pendingReview > 0)) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-900">
                  <Settings className="w-5 h-5" />
                  Pending Manual Review
                </CardTitle>
                <p className="text-sm text-yellow-700 mt-2">
                  {status?.pendingReviewCount || syncResults?.pendingReview} {((status?.pendingReviewCount || syncResults?.pendingReview) === 1) ? 'conversation needs' : 'conversations need'} your attention
                </p>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-yellow-300 text-yellow-800 hover:bg-yellow-100">
                  Review Pending Deals
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Confidence Thresholds */}
                <div>
                  <h4 className="font-medium mb-3">AI Confidence Thresholds</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg bg-green-50">
                      <div className="font-medium text-green-600">Auto-approve</div>
                      <div className="text-sm text-gray-600">Confidence ≥ 8</div>
                    </div>
                    <div className="p-3 border rounded-lg bg-yellow-50">
                      <div className="font-medium text-yellow-600">Manual review</div>
                      <div className="text-sm text-gray-600">Confidence 6-8</div>
                    </div>
                    <div className="p-3 border rounded-lg bg-red-50">
                      <div className="font-medium text-red-600">Auto-reject</div>
                      <div className="text-sm text-gray-600">Confidence &lt; 6</div>
                    </div>
                  </div>
                </div>

                {/* Sync Schedule */}
                <div>
                  <h4 className="font-medium mb-3">Sync Schedule</h4>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Automatic Daily Sync</div>
                        <div className="text-sm text-gray-600">Every day at 2:00 AM UTC</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={status.autoSyncEnabled}
                            onChange={handleAutoSyncToggle}
                            aria-label="Toggle automatic daily sync"
                          />
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer ${
                            status.autoSyncEnabled ? 'bg-green-600' : 'bg-gray-300'
                          }`}>
                            <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-all ${
                              status.autoSyncEnabled ? 'translate-x-full border-white' : ''
                            }`}></div>
                          </div>
                        </label>
                        <Badge 
                          variant="outline" 
                          className={`${
                            status.autoSyncEnabled 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {status.autoSyncEnabled ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Disabled
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Deals for Review */}
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
              <p className="text-sm text-gray-600">AI-detected deals waiting for your approval</p>
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

      {status && !status.isConnected && (
        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Gmail</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your Gmail account to automatically detect and extract deals from your email conversations using AI
            </p>
            <Button 
              onClick={handleConnect} 
              disabled={connecting}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Connect Gmail Account
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
