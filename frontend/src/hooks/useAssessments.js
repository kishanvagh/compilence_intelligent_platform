import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useAssessments = () => {
  const queryClient = useQueryClient();

  const assessmentsQuery = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      const response = await api.get('/compliance/assessments');
      return response.data.assessments || [];
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ documentId, framework }) => {
      const response = await api.post('/compliance/analyze', { documentId, framework });
      return response.data.assessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    },
  });

  return {
    assessments: assessmentsQuery.data || [],
    isLoading: assessmentsQuery.isLoading,
    error: assessmentsQuery.error,
    refetch: assessmentsQuery.refetch,

    analyzeDocument: analyzeMutation.mutateAsync,
    isAnalyzing: analyzeMutation.isPending,
    analyzeError: analyzeMutation.error,
  };
};

export const useAssessmentDetails = (id) => {
  const assessmentDetailsQuery = useQuery({
    queryKey: ['assessment', id],
    queryFn: async () => {
      const response = await api.get(`/compliance/assessments/${id}`);
      return response.data.assessment;
    },
    enabled: !!id,
  });

  const askRagMutation = useMutation({
    mutationFn: async ({ query, documentId }) => {
      const response = await api.post('/rag/ask', { query, documentId });
      return response.data; // { success, answer, sources }
    },
  });

  return {
    assessment: assessmentDetailsQuery.data,
    isLoading: assessmentDetailsQuery.isLoading,
    error: assessmentDetailsQuery.error,
    refetch: assessmentDetailsQuery.refetch,

    askQuestion: askRagMutation.mutateAsync,
    isAsking: askRagMutation.isPending,
    askError: askRagMutation.error,
  };
};
