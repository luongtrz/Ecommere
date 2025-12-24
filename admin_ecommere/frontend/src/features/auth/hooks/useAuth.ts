import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type User } from '../api/auth.api';
import { QUERY_KEYS } from '@/lib/constants';
import { useToast } from '@/hooks/useToast';
import { AxiosError } from 'axios';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: [QUERY_KEYS.USER],
    queryFn: () => {
      const currentUser = authApi.getCurrentUser();
      return Promise.resolve(currentUser);
    },
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEYS.USER], data.user);
      toast.success(`Chào mừng trở lại, ${data.user.name}!`);
      navigate('/');
    },
    onError: (error: AxiosError<any>) => {
      const message = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.';
      toast.error(message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      authApi.register(name, email, password),
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEYS.USER], data.user);
      toast.success(`Đăng ký thành công! Chào mừng ${data.user.name}!`);
      navigate('/');
    },
    onError: (error: AxiosError<any>) => {
      const message = error.response?.data?.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.';
      toast.error(message);
    },
  });

  const logout = async () => {
    try {
      await authApi.logout();
      queryClient.setQueryData([QUERY_KEYS.USER], null);
      queryClient.clear();
      toast.info('Đã đăng xuất thành công');
      navigate('/login');
    } catch (error) {
      // Even if logout fails, clear local state
      queryClient.setQueryData([QUERY_KEYS.USER], null);
      queryClient.clear();
      navigate('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await authApi.getProfile();
      queryClient.setQueryData([QUERY_KEYS.USER], updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    refreshUser,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    loginError: loginMutation.error as AxiosError<any> | null,
    registerError: registerMutation.error as AxiosError<any> | null,
  };
}
