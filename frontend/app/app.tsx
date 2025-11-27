import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Users, TrendingUp, LogOut, Settings } from 'lucide-react';
import ContactList from '@components/ContactList';
import ContactDetails from '@components/ContactDetails';
import { DealsBoardContainer } from '../components/DealsBoardContainer';
import DealDetailsPage from '@components/DealDetailsPage';
import GmailSyncSettings from '@components/GmailSyncSettings';
import ErrorBoundary from '@components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Auth } from '@components/Auth';
import { useMockData } from '@/lib/supabase';
import { Button } from '@components/ui/button';
import { useLoadAction } from '@/lib/quibakery-data';
import loadDealByIdAction from '@/actions/loadDealById';

type View = 'contacts' | 'contact-details' | 'deals' | 'deal-details' | 'settings';

function AppContent() {
  console.log('App rendering...');
  
  const [view, setView] = useState<View>('contacts');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const { user, loading, signOut } = useAuth();
  
  // Load selected deal for deal-details view
  const { data: selectedDealData, loading: loadingSelectedDeal, refresh: refreshSelectedDeal } = useLoadAction(
    loadDealByIdAction,
    [selectedDealId],
    { dealId: selectedDealId || '' }
  );
  const selectedDeal = selectedDealData && Array.isArray(selectedDealData) && selectedDealData.length > 0 
    ? selectedDealData[0] 
    : null;
  
  console.log('Current view:', view, 'selectedContactId:', selectedContactId);

  // Define callbacks BEFORE early returns (hooks must be called unconditionally)
  const handleViewContact = useCallback((contactId: string) => {
    setSelectedContactId(contactId);
    setView('contact-details');
  }, []);

  const handleViewDeal = useCallback((dealId: string) => {
    setSelectedDealId(dealId);
    setView('deal-details');
  }, []);

  const handleBackToContacts = useCallback(() => {
    setView('contacts');
    setSelectedContactId(null);
  }, []);

  const handleBackToDeals = useCallback(() => {
    setView('deals');
    setSelectedDealId(null);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    if (value === 'contacts') {
      setView('contacts');
      setSelectedContactId(null);
    } else if (value === 'deals') {
      setView('deals');
      setSelectedDealId(null);
    } else if (value === 'settings') {
      setView('settings');
      setSelectedContactId(null);
      setSelectedDealId(null);
    }
  }, []);

  // Show loading state
  if (!useMockData && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  // Show auth if not in mock mode and no user
  if (!useMockData && !user) {
    return <Auth />;
  }

  const activeTab = view === 'contacts' || view === 'contact-details' 
    ? 'contacts' 
    : view === 'settings'
    ? 'settings'
    : 'deals';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-white/95 backdrop-blur-sm shadow-xl border border-slate-200/50">
            <TabsTrigger
              value="contacts"
              className="text-slate-600 hover:bg-slate-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger
              value="deals"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Deals
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {!useMockData && user && (
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="bg-white/95 backdrop-blur-sm shadow-xl border border-slate-200/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        )}
      </div>

      {view === 'contacts' && <ContactList onViewContact={handleViewContact} />}

      {view === 'contact-details' && selectedContactId && (
        <ErrorBoundary>
          <ContactDetails
            contactId={selectedContactId}
            onBack={handleBackToContacts}
            onViewDeal={handleViewDeal}
          />
        </ErrorBoundary>
      )}

      {view === 'deals' && (
        <DealsBoardContainer onViewDeal={handleViewDeal} />
      )}

      {view === 'settings' && (
        <div className="pt-24 px-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>
            <ErrorBoundary>
              <GmailSyncSettings />
            </ErrorBoundary>
          </div>
        </div>
      )}

      {view === 'deal-details' && selectedDealId && (
        <>
          {loadingSelectedDeal ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-slate-600">Loading deal...</div>
            </div>
          ) : selectedDeal ? (
            <DealDetailsPage
              deal={selectedDeal}
              onBack={handleBackToDeals}
              onEdit={() => {
                // Edit functionality - could open edit modal or navigate
                console.log('Edit deal:', selectedDeal.id);
              }}
              onStageChange={(dealId, newStage) => {
                // Handle stage change
                console.log('Stage changed:', dealId, newStage);
                refreshSelectedDeal();
              }}
              onDealUpdated={() => {
                // Refresh deal data after updates
                refreshSelectedDeal();
              }}
            />
          ) : (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-slate-600">Deal not found</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;