import apiClient, { authToken } from '@/lib/api';
import { z } from 'zod';

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
  phone: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

const loginResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
  expiresIn: z.string(),
});

const registerResponseSchema = loginResponseSchema;

export type User = z.infer<typeof userSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      // Backend wraps with TransformInterceptor
      const actualData = response.data.data || response.data;
      
      console.log('Login response actualData:', actualData);
      
      const parsed = loginResponseSchema.parse(actualData);
      
      // ⚠️ ONLY store access token in memory (NO refreshToken - it's in HTTP-only cookie)
      authToken.set(parsed.accessToken);
      
      // Store non-sensitive user data
      localStorage.setItem('user', JSON.stringify(parsed.user));
      
      return parsed;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(name: string, email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      // Backend wraps with TransformInterceptor
      const actualData = response.data.data || response.data;
      
      console.log('Register response actualData:', actualData);
      
      const parsed = registerResponseSchema.parse(actualData);
      
      // ⚠️ ONLY store access token in memory (NO refreshToken - it's in HTTP-only cookie)
      authToken.set(parsed.accessToken);
      
      // Store non-sensitive user data
      localStorage.setItem('user', JSON.stringify(parsed.user));
      
      return parsed;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get('/users/me');
    const actualData = response.data.data || response.data;
    return userSchema.parse(actualData);
  },

  async logout() {
    try {
      // Call backend to revoke refresh token and clear cookies
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if backend fails
    } finally {
      // Clear memory token
      authToken.remove();
      localStorage.removeItem('user');
      // Cookies will be cleared by backend
    }
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return userSchema.parse(JSON.parse(userStr));
    } catch {
      return null;
    }
  },
};
