import { describe, expect, it, vi, beforeEach } from 'vitest';
import apiClient from '@/lib/api';
import {
  usersApi,
  type Address,
  type UserProfile,
  type CreateAddressDto,
  type UpdateAddressDto,
  type UpdateProfileDto,
} from './users.api';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('usersApi', () => {
  const mockedApiClient = vi.mocked(apiClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateProfile', () => {
    const validProfile: UserProfile = {
      id: 'usr-123',
      email: 'admin@example.com',
      name: 'Nguyễn Văn Quản Trị',
      role: 'ADMIN',
      phone: '0912345678',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };

    it('patches profile and returns parsed UserProfile with all fields', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { data: validProfile },
      });

      const payload: UpdateProfileDto = {
        name: 'Nguyễn Văn Quản Trị',
        phone: '0912345678',
      };
      const result = await usersApi.updateProfile(payload);

      expect(mockedApiClient.patch).toHaveBeenCalledWith('/users/me', payload);
      expect(result).toEqual(validProfile);
    });

    it('handles CUSTOMER role correctly', async () => {
      const customerProfile = {
        ...validProfile,
        id: 'usr-customer',
        role: 'CUSTOMER',
      };
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { data: customerProfile },
      });

      const result = await usersApi.updateProfile({ name: 'Khách hàng' });
      expect(result.role).toBe('CUSTOMER');
    });

    it('transforms null name to empty string', async () => {
      const profileWithNullName = {
        ...validProfile,
        name: null,
      };
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { data: profileWithNullName },
      });

      const result = await usersApi.updateProfile({});
      expect(result.name).toBe('');
    });

    it('transforms undefined name to empty string', async () => {
      const { name: _, ...profileWithoutName } = validProfile;
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { data: profileWithoutName },
      });

      const result = await usersApi.updateProfile({});
      expect(result.name).toBe('');
    });

    it('accepts null and optional fields (email, phone, createdAt, updatedAt)', async () => {
      const minimalProfile = {
        id: 'usr-min',
        email: null,
        name: 'Tối Giản',
        role: 'CUSTOMER',
        phone: null,
      };
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { data: minimalProfile },
      });

      const result = await usersApi.updateProfile({ name: 'Tối Giản' });
      expect(result).toEqual({
        id: 'usr-min',
        email: null,
        name: 'Tối Giản',
        role: 'CUSTOMER',
        phone: null,
      });
    });

    it('accepts undefined email and phone fields', async () => {
      const profileWithoutContact = {
        id: 'usr-no-contact',
        name: 'Ẩn Danh',
        role: 'CUSTOMER',
      };
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { data: profileWithoutContact },
      });

      const result = await usersApi.updateProfile({});
      expect(result).toEqual({
        id: 'usr-no-contact',
        name: 'Ẩn Danh',
        role: 'CUSTOMER',
      });
    });

    it('throws validation error when response has invalid email format', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: {
          data: {
            ...validProfile,
            email: 'not-an-email',
          },
        },
      });

      await expect(usersApi.updateProfile({ name: 'Test' })).rejects.toThrow();
    });

    it('throws validation error when response has invalid role', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: {
          data: {
            ...validProfile,
            role: 'SUPERADMIN',
          },
        },
      });

      await expect(usersApi.updateProfile({ name: 'Test' })).rejects.toThrow();
    });

    it('throws validation error when response misses required id', async () => {
      const { id: _, ...invalidProfile } = validProfile;
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { data: invalidProfile },
      });

      await expect(usersApi.updateProfile({ name: 'Test' })).rejects.toThrow();
    });

    it('propagates network or client error when apiClient.patch rejects', async () => {
      const networkError = new Error('Network error');
      vi.mocked(apiClient.patch).mockRejectedValueOnce(networkError);

      await expect(usersApi.updateProfile({ name: 'Fail' })).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getAddresses', () => {
    const sampleAddresses: Address[] = [
      {
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
      },
      {
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
      },
    ];

    it('fetches addresses and returns parsed array', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: sampleAddresses },
      });

      const result = await usersApi.getAddresses();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/users/addresses');
      expect(result).toEqual(sampleAddresses);
    });

    it('returns empty array when user has no addresses', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: [] },
      });

      const result = await usersApi.getAddresses();
      expect(result).toEqual([]);
    });

    it('throws validation error when response data is not an array', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { notAnArray: true } },
      });

      await expect(usersApi.getAddresses()).rejects.toThrow();
    });

    it('throws validation error when an address item misses required fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'addr-invalid',
              isDefault: true,
            },
          ],
        },
      });

      await expect(usersApi.getAddresses()).rejects.toThrow();
    });

    it('propagates error when apiClient.get rejects', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Server error'));

      await expect(usersApi.getAddresses()).rejects.toThrow('Server error');
    });
  });

  describe('createAddress', () => {
    const newAddressPayload: CreateAddressDto = {
      fullName: 'Lê Văn C',
      phone: '0901234567',
      province: 'Đà Nẵng',
      district: 'Hải Châu',
      ward: 'Thạch Thang',
      line1: '789 Đường Bạch Đằng',
      isDefault: true,
    };

    const createdAddress: Address = {
      id: 'addr-new',
      userId: 'usr-100',
      ...newAddressPayload,
      isDefault: true,
      createdAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    };

    it('posts new address and returns parsed Address', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: createdAddress },
      });

      const result = await usersApi.createAddress(newAddressPayload);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/users/addresses',
        newAddressPayload,
      );
      expect(result).toEqual(createdAddress);
    });

    it('handles create address without optional isDefault and without updatedAt', async () => {
      const { isDefault: _, ...payloadWithoutDefault } = newAddressPayload;
      const responseAddress: Address = {
        id: 'addr-new-2',
        userId: 'usr-100',
        ...payloadWithoutDefault,
        isDefault: false,
        createdAt: '2026-02-01T00:00:00.000Z',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: responseAddress },
      });

      const result = await usersApi.createAddress(payloadWithoutDefault);
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/users/addresses',
        payloadWithoutDefault,
      );
      expect(result).toEqual(responseAddress);
      expect(result.isDefault).toBe(false);
      expect(result.updatedAt).toBeUndefined();
    });

    it('throws validation error when returned address data is invalid', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: { id: 'addr-only' } },
      });

      await expect(usersApi.createAddress(newAddressPayload)).rejects.toThrow();
    });

    it('propagates error when apiClient.post rejects', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(
        new Error('Failed to create address'),
      );

      await expect(usersApi.createAddress(newAddressPayload)).rejects.toThrow(
        'Failed to create address',
      );
    });
  });

  describe('updateAddress', () => {
    const updatePayload: UpdateAddressDto = {
      fullName: 'Nguyễn Văn Đã Đổi',
      phone: '0933445566',
      line1: '999 Đường Mới',
      isDefault: false,
    };

    const updatedAddress: Address = {
      id: 'addr-1',
      userId: 'usr-100',
      fullName: 'Nguyễn Văn Đã Đổi',
      phone: '0933445566',
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      ward: 'Dịch Vọng Hậu',
      line1: '999 Đường Mới',
      isDefault: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-10T10:00:00.000Z',
    };

    it('patches address and returns parsed Address', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { data: updatedAddress },
      });

      const result = await usersApi.updateAddress('addr-1', updatePayload);

      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/users/addresses/addr-1',
        updatePayload,
      );
      expect(result).toEqual(updatedAddress);
    });

    it('handles updating with partial fields', async () => {
      const partialPayload: UpdateAddressDto = {
        isDefault: true,
      };
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { data: { ...updatedAddress, isDefault: true } },
      });

      const result = await usersApi.updateAddress('addr-1', partialPayload);
      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/users/addresses/addr-1',
        partialPayload,
      );
      expect(result.isDefault).toBe(true);
    });

    it('throws validation error when returned address data is invalid', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: { data: { invalid: true } },
      });

      await expect(
        usersApi.updateAddress('addr-1', updatePayload),
      ).rejects.toThrow();
    });

    it('propagates error when apiClient.patch rejects', async () => {
      vi.mocked(apiClient.patch).mockRejectedValueOnce(
        new Error('Failed to update address'),
      );

      await expect(
        usersApi.updateAddress('addr-1', updatePayload),
      ).rejects.toThrow('Failed to update address');
    });
  });

  describe('deleteAddress', () => {
    it('deletes address and resolves void', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        data: { message: 'Xóa địa chỉ thành công' },
      });

      const result = await usersApi.deleteAddress('addr-to-delete');

      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        '/users/addresses/addr-to-delete',
      );
      expect(result).toBeUndefined();
    });

    it('propagates error when apiClient.delete rejects', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(
        new Error('Failed to delete address'),
      );

      await expect(usersApi.deleteAddress('addr-to-delete')).rejects.toThrow(
        'Failed to delete address',
      );
    });
  });
});
