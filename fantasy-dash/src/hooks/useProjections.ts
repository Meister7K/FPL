import { useCallback, useEffect, useState } from 'react';
import projectionsService from '../services/projectionsService';

interface UseProjectionsOptions {
  playerIds: string[];
  week: number;
  year: number;
  enabled?: boolean;
}

interface UseProjectionsReturn {
  projections: Record<string, number>;
  loading: boolean;
  error: string | null;
  progress: { completed: number; total: number };
  refetch: () => void;
  clearCache: () => void;
}

export const useProjections = ({
  playerIds,
  week,
  year,
  enabled = true
}: UseProjectionsOptions): UseProjectionsReturn => {
  const [projections, setProjections] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ completed: number; total: number }>({ 
    completed: 0, 
    total: 0 
  });

  const handleProgress = useCallback((completed: number, total: number) => {
    setProgress({ completed, total });
  }, []);

  const fetchProjections = useCallback(async () => {
    if (!enabled || playerIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ completed: 0, total: playerIds.length });

    try {
      const result = await projectionsService.getProjections(
        playerIds,
        week,
        year,
        handleProgress
      );
      
      setProjections(result);
    } catch (err) {
      console.error('Error fetching projections:', err);
      setError('Failed to load projections. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [playerIds, week, year, enabled, handleProgress]);

  const clearCache = useCallback(() => {
    projectionsService.clearCache();
  }, []);

  const refetch = useCallback(() => {
    fetchProjections();
  }, [fetchProjections]);

  useEffect(() => {
    fetchProjections();
  }, [fetchProjections]);

  // Cleanup expired cache on unmount
  useEffect(() => {
    return () => {
      projectionsService.clearExpiredCache();
    };
  }, []);

  return {
    projections,
    loading,
    error,
    progress,
    refetch,
    clearCache
  };
};

export default useProjections;