import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type User } from '../api/auth.api';
import { QUERY_KEYS } from '@/lib/constants';
import { useToast } from '@/hooks/useToast';
import { AxiosError } from 'axios';
import { useChatStore } from '@/features/chatbot/store/chatStore';

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
    mutationFn: ({ phone, password }: { phone: string; password: string }) =>
      authApi.login(phone, password),
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEYS.USER], data.user);
      toast.success(`Chào mừng trở lại, ${data.user.name}!`);
      navigate('/');
    },
    onError: (error: AxiosError<any>) => {
      const message =
        error.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại số điện thoại và mật khẩu.';
      toast.error(message);
    },
  });

  const logout = async () => {
    try {
      await authApi.logout();
      useChatStore.getState().reset();
      queryClient.setQueryData([QUERY_KEYS.USER], null);
      queryClient.clear();
      toast.info('Đã đăng xuất thành công');
      navigate('/login');
    } catch (error) {
      // Even if logout fails, clear local state
      useChatStore.getState().reset();
      queryClient.setQueryData([QUERY_KEYS.USER], null);
      queryClient.clear();
      navigate('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await authApi.getProfile();
      queryClient.setQueryData([QUERY_KEYS.USER], updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
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
    logout,
    refreshUser,
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error as AxiosError<any> | null,
  };
}
