import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      queryClient.clear();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }) => {
      const response = await api.post('/auth/register', { name, email, password });
      return response.data;
    },
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    queryClient.clear();
    window.location.href = '/login';
  };

  return {
    user,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
    isAuthenticated: !!user,
  };
};
