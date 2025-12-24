import apiClient from '@/lib/api';
import { z } from 'zod';

// ===========================
// Schemas
// ===========================

const addressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  phone: z.string(),
  province: z.string(),
  district: z.string(),
  ward: z.string(),
  line1: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

const userProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
  phone: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// ===========================
// Types
// ===========================

export type Address = z.infer<typeof addressSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;

export interface CreateAddressDto {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  line1: string;
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  fullName?: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  line1?: string;
  isDefault?: boolean;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
}

// ===========================
// API Functions
// ===========================

export const usersApi = {
  // Profile
  async updateProfile(data: UpdateProfileDto): Promise<UserProfile> {
    const response = await apiClient.patch('/users/me', data);
    return userProfileSchema.parse(response.data.data);
  },

  // Addresses
  async getAddresses(): Promise<Address[]> {
    const response = await apiClient.get('/users/addresses');
    return z.array(addressSchema).parse(response.data.data);
  },

  async createAddress(data: CreateAddressDto): Promise<Address> {
    const response = await apiClient.post('/users/addresses', data);
    return addressSchema.parse(response.data.data);
  },

  async updateAddress(id: string, data: UpdateAddressDto): Promise<Address> {
    const response = await apiClient.patch(`/users/addresses/${id}`, data);
    return addressSchema.parse(response.data.data);
  },

  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/users/addresses/${id}`);
  },
};
