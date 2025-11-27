import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Sparkles, Lightbulb, TrendingUp, Brain, Loader2, X, AlertCircle } from 'lucide-react';

type Props = {
  contactId: string;
  contactName: string;
};

type AnalysisResult = {
  analysis: string;
  type: string;
  timestamp: number;
} | null;

type ErrorState = {
  message: string;
  details?: string;
} | null;

// Use env variable for Render deployment, otherwise use relative URL (proxied in dev or Vercel)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function AIRelationshipManager({ contactId, contactName }: Props) {
  const [loadingEngagement, setLoadingEngagement] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingResearch, setLoadingResearch] = useState(false);
  
  const [engagementTips, setEngagementTips] = useState<AnalysisResult>(null);
  const [healthScore, setHealthScore] = useState<AnalysisResult>(null);
  const [contextualResearch, setContextualResearch] = useState<AnalysisResult>(null);

  const [engagementError, setEngagementError] = useState<ErrorState>(null);
  const [healthError, setHealthError] = useState<ErrorState>(null);
  const [researchError, setResearchError] = useState<ErrorState>(null);

  const handleEngagementTips = async () => {
    setLoadingEngagement(true);
    setEngagementError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactId, 
          analysisType: 'next-action' 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setEngagementTips({ ...data, timestamp: Date.now() });
    } catch (error) {
      console.error('Error fetching engagement tips:', error);
      setEngagementError({
        message: 'Failed to get engagement tips',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoadingEngagement(false);
    }
  };

  const handleHealthScore = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactId, 
          analysisType: 'relationship' 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setHealthScore({ ...data, timestamp: Date.now() });
    } catch (error) {
      console.error('Error fetching health score:', error);
      setHealthError({
        message: 'Failed to get health score',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleContextualResearch = async () => {
    setLoadingResearch(true);
    setResearchError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactId, 
          analysisType: 'contextual-research' 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setContextualResearch({ ...data, timestamp: Date.now() });
    } catch (error) {
      console.error('Error fetching contextual research:', error);
      setResearchError({
        message: 'Failed to get contextual research',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoadingResearch(false);
    }
  };

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Relationship Manager</CardTitle>
            <p className="text-xs text-indigo-100 mt-1">AI-powered insights for {contactName} • v2.0</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <p className="text-sm text-slate-700 leading-relaxed">
          Get AI-powered insights to help you build stronger relationships with {contactName}.
        </p>
        
        {/* AI Features */}
        <div className="space-y-3">
          {/* Smart Engagement Tips */}
          <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-indigo-100">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Smart Engagement Tips</p>
                <p className="text-xs text-slate-600 mt-1">Get AI-powered suggestions on when and how to reach out</p>
              </div>
              <Button
                size="sm"
                onClick={handleEngagementTips}
                disabled={loadingEngagement}
                className="shrink-0 bg-amber-500 hover:bg-amber-600"
              >
                {loadingEngagement ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    <span className="text-xs">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-3 h-3 mr-1" />
                    <span className="text-xs">Analyze</span>
                  </>
                )}
              </Button>
            </div>
            {engagementError && (
              <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800">{engagementError.message}</p>
                    {engagementError.details && (
                      <p className="text-xs text-red-600 mt-1">{engagementError.details}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setEngagementError(null)}
                    className="text-red-400 hover:text-red-600"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {engagementTips && (
              <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap flex-1">{engagementTips.analysis}</p>
                  <button
                    onClick={() => setEngagementTips(null)}
                    className="text-amber-400 hover:text-amber-600 shrink-0"
                    aria-label="Clear result"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  Analyzed {new Date(engagementTips.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
          
          {/* Relationship Health Score */}
          <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-indigo-100">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Relationship Health Score</p>
                <p className="text-xs text-slate-600 mt-1">Track interaction patterns and identify opportunities</p>
              </div>
              <Button
                size="sm"
                onClick={handleHealthScore}
                disabled={loadingHealth}
                className="shrink-0 bg-emerald-500 hover:bg-emerald-600"
              >
                {loadingHealth ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    <span className="text-xs">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-3 h-3 mr-1" />
                    <span className="text-xs">Analyze</span>
                  </>
                )}
              </Button>
            </div>
            {healthError && (
              <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800">{healthError.message}</p>
                    {healthError.details && (
                      <p className="text-xs text-red-600 mt-1">{healthError.details}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setHealthError(null)}
                    className="text-red-400 hover:text-red-600"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {healthScore && (
              <div className="mt-3 p-3 bg-emerald-50 rounded border border-emerald-200">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap flex-1">{healthScore.analysis}</p>
                  <button
                    onClick={() => setHealthScore(null)}
                    className="text-emerald-400 hover:text-emerald-600 shrink-0"
                    aria-label="Clear result"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-emerald-600 mt-2">
                  Analyzed {new Date(healthScore.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
          
          {/* Contextual Research */}
          <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-indigo-100">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Contextual Research</p>
                <p className="text-xs text-slate-600 mt-1">Automatic background research and conversation starters</p>
              </div>
              <Button
                size="sm"
                onClick={handleContextualResearch}
                disabled={loadingResearch}
                className="shrink-0 bg-purple-500 hover:bg-purple-600"
              >
                {loadingResearch ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    <span className="text-xs">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-3 h-3 mr-1" />
                    <span className="text-xs">Analyze</span>
                  </>
                )}
              </Button>
            </div>
            {researchError && (
              <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800">{researchError.message}</p>
                    {researchError.details && (
                      <p className="text-xs text-red-600 mt-1">{researchError.details}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setResearchError(null)}
                    className="text-red-400 hover:text-red-600"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {contextualResearch && (
              <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap flex-1">{contextualResearch.analysis}</p>
                  <button
                    onClick={() => setContextualResearch(null)}
                    className="text-purple-400 hover:text-purple-600 shrink-0"
                    aria-label="Clear result"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  Analyzed {new Date(contextualResearch.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border border-indigo-200">
          <p className="text-xs text-center text-indigo-700 font-medium">
            💡 Click "Analyze" buttons above to get AI-powered insights
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
