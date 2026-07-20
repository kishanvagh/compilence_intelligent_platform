import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useDocuments = () => {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await api.get('/documents');
      return response.data.documents || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, workspaceId }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (workspaceId) {
        formData.append('workspaceId', workspaceId);
      }
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (documentId) => {
      const response = await api.post(`/qdrant/sync/${documentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId) => {
      const response = await api.delete(`/documents/${documentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    },
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    refetch: documentsQuery.refetch,
    
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,

    syncDocument: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,

    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
};
