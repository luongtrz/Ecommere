import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, type CreateAddressDto, type UpdateAddressDto } from '../api/users.api';
import { toast } from 'sonner';

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => usersApi.getAddresses(),
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAddressDto) => usersApi.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Thêm địa chỉ thành công');
    },
    onError: () => {
      toast.error('Thêm địa chỉ thất bại');
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressDto }) =>
      usersApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Cập nhật địa chỉ thành công');
    },
    onError: () => {
      toast.error('Cập nhật địa chỉ thất bại');
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Xóa địa chỉ thành công');
    },
    onError: () => {
      toast.error('Xóa địa chỉ thất bại');
    },
  });
}
