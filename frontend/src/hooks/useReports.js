import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useReports = () => {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await api.get('/reports');
      return response.data.reports || [];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async ({ documentId }) => {
      const response = await api.post('/reports/generate', { documentId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    },
  });

  return {
    reports: reportsQuery.data || [],
    isLoading: reportsQuery.isLoading,
    error: reportsQuery.error,
    refetch: reportsQuery.refetch,

    generateReport: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    generateError: generateMutation.error,
  };
};

export const useReportDetails = (id) => {
  const reportDetailsQuery = useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const response = await api.get(`/reports/${id}`);
      return response.data.report;
    },
    enabled: !!id,
  });

  return {
    report: reportDetailsQuery.data,
    isLoading: reportDetailsQuery.isLoading,
    error: reportDetailsQuery.error,
    refetch: reportDetailsQuery.refetch,
  };
};
