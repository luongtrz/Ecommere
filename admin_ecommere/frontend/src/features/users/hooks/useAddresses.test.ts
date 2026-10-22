import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from './useAddresses';
import {
  usersApi,
  type Address,
  type CreateAddressDto,
  type UpdateAddressDto,
} from '../api/users.api';

vi.mock('../api/users.api', () => ({
  usersApi: {
    getAddresses: vi.fn(),
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const sampleAddress1: Address = {
  id: 'addr-1',
  userId: 'usr-100',
  fullName: 'Nguyễn Văn A',
  phone: '0912345678',
  province: 'Hà Nội',
  district: 'Cầu Giấy',
  ward: 'Dịch Vọng Hậu',
  line1: '123 Đường Cầu Giấy',
  isDefault: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const sampleAddress2: Address = {
  id: 'addr-2',
  userId: 'usr-100',
  fullName: 'Trần Thị B',
  phone: '0987654321',
  province: 'TP Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Bến Nghé',
  line1: '456 Đường Lê Lợi',
  isDefault: false,
  createdAt: '2026-01-03T00:00:00.000Z',
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe('useAddresses hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('useAddresses', () => {
    it('fetches and returns address list on success', async () => {
      vi.mocked(usersApi.getAddresses).mockResolvedValueOnce([
        sampleAddress1,
        sampleAddress2,
      ]);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useAddresses(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([sampleAddress1, sampleAddress2]);
      expect(usersApi.getAddresses).toHaveBeenCalledTimes(1);
    });

    it('handles empty address list correctly', async () => {
      vi.mocked(usersApi.getAddresses).mockResolvedValueOnce([]);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useAddresses(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
      expect(usersApi.getAddresses).toHaveBeenCalledTimes(1);
    });

    it('handles error state when fetching addresses fails', async () => {
      const fetchError = new Error('Lỗi tải danh sách địa chỉ');
      vi.mocked(usersApi.getAddresses).mockRejectedValueOnce(fetchError);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useAddresses(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(fetchError);
      expect(usersApi.getAddresses).toHaveBeenCalledTimes(1);
    });

    it('returns loading state initially before query resolves', () => {
      vi.mocked(usersApi.getAddresses).mockReturnValueOnce(
        new Promise(() => {}),
      );

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);
      const { result } = renderHook(() => useAddresses(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isPending).toBe(true);
    });
  });

  describe('useCreateAddress', () => {
    const newAddressDto: CreateAddressDto = {
      fullName: 'Lê Văn C',
      phone: '0901234567',
      province: 'Đà Nẵng',
      district: 'Hải Châu',
      ward: 'Thạch Thang',
      line1: '789 Đường Bạch Đằng',
      isDefault: true,
    };

    it('creates address successfully with mutateAsync, invalidates query and displays success toast', async () => {
      const createdAddress: Address = {
        id: 'addr-3',
        userId: 'usr-100',
        ...newAddressDto,
        isDefault: newAddressDto.isDefault ?? false,
        createdAt: '2026-02-01T00:00:00.000Z',
      };
      vi.mocked(usersApi.createAddress).mockResolvedValueOnce(createdAddress);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useCreateAddress(), { wrapper });

      let mutationResult: Address | undefined;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(newAddressDto);
      });

      expect(usersApi.createAddress).toHaveBeenCalledWith(newAddressDto);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['addresses'] });
      expect(toast.success).toHaveBeenCalledWith('Thêm địa chỉ thành công');
      expect(toast.error).not.toHaveBeenCalled();
      expect(mutationResult).toEqual(createdAddress);
    });

    it('creates address successfully with mutate callback', async () => {
      const createdAddress: Address = {
        id: 'addr-3b',
        userId: 'usr-100',
        ...newAddressDto,
        isDefault: true,
        createdAt: '2026-02-01T00:00:00.000Z',
      };
      vi.mocked(usersApi.createAddress).mockResolvedValueOnce(createdAddress);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useCreateAddress(), { wrapper });

      act(() => {
        result.current.mutate(newAddressDto);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(usersApi.createAddress).toHaveBeenCalledWith(newAddressDto);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['addresses'] });
      expect(toast.success).toHaveBeenCalledWith('Thêm địa chỉ thành công');
    });

    it('handles creation failure and displays error toast', async () => {
      const createError = new Error('Tạo địa chỉ thất bại');
      vi.mocked(usersApi.createAddress).mockRejectedValueOnce(createError);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useCreateAddress(), { wrapper });

      await act(async () => {
        await expect(result.current.mutateAsync(newAddressDto)).rejects.toThrow(
          'Tạo địa chỉ thất bại',
        );
      });

      expect(usersApi.createAddress).toHaveBeenCalledWith(newAddressDto);
      expect(invalidateSpy).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Thêm địa chỉ thất bại');
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('useUpdateAddress', () => {
    const updateDto: UpdateAddressDto = {
      fullName: 'Nguyễn Văn Đã Đổi',
      phone: '0933445566',
      line1: '999 Đường Cập Nhật',
      isDefault: false,
    };

    it('updates address successfully with mutateAsync, invalidates query and displays success toast', async () => {
      const updatedAddress: Address = {
        ...sampleAddress1,
        ...updateDto,
        updatedAt: '2026-02-02T00:00:00.000Z',
      };
      vi.mocked(usersApi.updateAddress).mockResolvedValueOnce(updatedAddress);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useUpdateAddress(), { wrapper });

      let mutationResult: Address | undefined;
      await act(async () => {
        mutationResult = await result.current.mutateAsync({
          id: 'addr-1',
          data: updateDto,
        });
      });

      expect(usersApi.updateAddress).toHaveBeenCalledWith('addr-1', updateDto);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['addresses'] });
      expect(toast.success).toHaveBeenCalledWith('Cập nhật địa chỉ thành công');
      expect(toast.error).not.toHaveBeenCalled();
      expect(mutationResult).toEqual(updatedAddress);
    });

    it('updates address successfully with mutate callback', async () => {
      const updatedAddress: Address = {
        ...sampleAddress1,
        ...updateDto,
        updatedAt: '2026-02-02T00:00:00.000Z',
      };
      vi.mocked(usersApi.updateAddress).mockResolvedValueOnce(updatedAddress);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useUpdateAddress(), { wrapper });

      act(() => {
        result.current.mutate({ id: 'addr-1', data: updateDto });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(usersApi.updateAddress).toHaveBeenCalledWith('addr-1', updateDto);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['addresses'] });
      expect(toast.success).toHaveBeenCalledWith('Cập nhật địa chỉ thành công');
    });

    it('handles update failure and displays error toast', async () => {
      const updateError = new Error('Cập nhật địa chỉ thất bại');
      vi.mocked(usersApi.updateAddress).mockRejectedValueOnce(updateError);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useUpdateAddress(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync({ id: 'addr-1', data: updateDto }),
        ).rejects.toThrow('Cập nhật địa chỉ thất bại');
      });

      expect(usersApi.updateAddress).toHaveBeenCalledWith('addr-1', updateDto);
      expect(invalidateSpy).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Cập nhật địa chỉ thất bại');
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('useDeleteAddress', () => {
    it('deletes address successfully with mutateAsync, invalidates query and displays success toast', async () => {
      vi.mocked(usersApi.deleteAddress).mockResolvedValueOnce(undefined);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useDeleteAddress(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('addr-1');
      });

      expect(usersApi.deleteAddress).toHaveBeenCalledWith('addr-1');
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['addresses'] });
      expect(toast.success).toHaveBeenCalledWith('Xóa địa chỉ thành công');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('deletes address successfully with mutate callback', async () => {
      vi.mocked(usersApi.deleteAddress).mockResolvedValueOnce(undefined);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useDeleteAddress(), { wrapper });

      act(() => {
        result.current.mutate('addr-1');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(usersApi.deleteAddress).toHaveBeenCalledWith('addr-1');
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['addresses'] });
      expect(toast.success).toHaveBeenCalledWith('Xóa địa chỉ thành công');
    });

    it('handles delete failure and displays error toast', async () => {
      const deleteError = new Error('Xóa địa chỉ thất bại');
      vi.mocked(usersApi.deleteAddress).mockRejectedValueOnce(deleteError);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useDeleteAddress(), { wrapper });

      await act(async () => {
        await expect(result.current.mutateAsync('addr-1')).rejects.toThrow(
          'Xóa địa chỉ thất bại',
        );
      });

      expect(usersApi.deleteAddress).toHaveBeenCalledWith('addr-1');
      expect(invalidateSpy).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Xóa địa chỉ thất bại');
      expect(toast.success).not.toHaveBeenCalled();
    });
  });
});
