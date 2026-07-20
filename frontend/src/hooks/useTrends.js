import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useTrends = () => {
  const trendsQuery = useQuery({
    queryKey: ['trends'],
    queryFn: async () => {
      const response = await api.get('/trends');
      return response.data.frameworks || [];
    },
  });

  return {
    trends: trendsQuery.data || [],
    isLoading: trendsQuery.isLoading,
    error: trendsQuery.error,
    refetch: trendsQuery.refetch,
  };
};
