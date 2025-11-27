import { useState, useEffect, useCallback } from 'react';

// Data loading hook that works with async functions (like Supabase queries)
export function useLoadAction(action: any, deps?: any[], params: any = {}) {
  const [data, setData] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadData = useCallback(async () => {
    console.log('useLoadAction: Starting to load data...', { actionName: action?.name, params });
    setLoading(true);
    setError(null);
    
    try {
      // Call the action function directly (it's now an async function)
      const result = await action(params);
      console.log('useLoadAction: Data loaded successfully', { actionName: action?.name, result, resultType: typeof result, isArray: Array.isArray(result) });
      setData(result);
    } catch (err) {
      console.error('useLoadAction: Error loading data:', err);
      setError(err);
      setData(undefined);
    } finally {
      setLoading(false);
    }
  }, [action, JSON.stringify(params)]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = () => {
    loadData();
  };

  return { data, loading, error, refresh };
}

// Mutation hook that works with async functions (like Supabase mutations)
export function useMutateAction(action: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const mutate = async (params: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the action function directly (it's now an async function)
      const result = await action(params);
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Error mutating data:', err);
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  return [mutate, { isLoading: loading, error }] as const;
}

// Kept for backward compatibility but not needed with Supabase
export function action(name: string, type: string, config?: any) {
  return { _actionName: name, type, config };
}
