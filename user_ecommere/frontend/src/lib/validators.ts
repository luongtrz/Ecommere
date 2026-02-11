import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ');

export const emailSchema = z.string().email('Email không hợp lệ');

export const passwordSchema = z
  .string()
  .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
  .max(50, 'Mật khẩu không được quá 50 ký tự');

export const requiredString = (fieldName: string) =>
  z.string().min(1, `${fieldName} là bắt buộc`);

export const positiveNumber = (fieldName: string) =>
  z.number().positive(`${fieldName} phải là số dương`);

export const loginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: requiredString('Tên'),
  phone: phoneSchema,
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  password: passwordSchema,
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export const addressSchema = z.object({
  fullName: requiredString('Họ tên'),
  phone: phoneSchema,
  address: requiredString('Địa chỉ'),
  ward: requiredString('Phường/Xã'),
  district: requiredString('Quận/Huyện'),
  province: requiredString('Tỉnh/Thành phố'),
  isDefault: z.boolean().optional(),
});

export const productSchema = z.object({
  name: requiredString('Tên sản phẩm'),
  slug: requiredString('Đường dẫn'),
  description: requiredString('Mô tả'),
  categoryId: requiredString('Danh mục'),
  basePrice: positiveNumber('Giá gốc'),
  images: z.array(z.string()).min(1, 'Cần ít nhất 1 hình ảnh'),
});

export const variantSchema = z.object({
  scent: requiredString('Mùi hương'),
  volumeMl: positiveNumber('Dung tích'),
  price: positiveNumber('Giá'),
  salePrice: z.number().optional(),
  stock: z.number().min(0, 'Tồn kho không được âm'),
  sku: requiredString('Mã SKU'),
});

export const couponSchema = z.object({
  code: requiredString('Mã giảm giá'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: positiveNumber('Giá trị giảm'),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  startDate: z.string(),
  endDate: z.string(),
  usageLimit: z.number().min(1).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
