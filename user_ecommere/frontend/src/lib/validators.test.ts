import { describe, expect, it } from 'vitest';
import {
  phoneSchema,
  emailSchema,
  passwordSchema,
  requiredString,
  positiveNumber,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  addressSchema,
  productSchema,
  variantSchema,
  couponSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type AddressInput,
  type ProductInput,
  type VariantInput,
  type CouponInput,
} from './validators';

describe('validators', () => {
  describe('phoneSchema', () => {
    it('accepts valid 10-digit Vietnamese phone numbers starting with 0', () => {
      const result = phoneSchema.safeParse('0987654321');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('0987654321');
      }
    });

    it('accepts valid 11-digit Vietnamese phone numbers starting with 0', () => {
      const result = phoneSchema.safeParse('01234567890');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('01234567890');
      }
    });

    it('accepts valid phone numbers with +84 country code', () => {
      expect(phoneSchema.safeParse('+84987654321').success).toBe(true);
      expect(phoneSchema.safeParse('+841234567890').success).toBe(true);
    });

    it('rejects invalid phone numbers with correct Vietnamese error message', () => {
      const invalidNumbers = [
        '0987654', // too short
        '098765432101', // too long
        '84987654321', // missing plus sign
        '1234567890', // invalid prefix
        '098765432a', // contains letters
        '', // empty string
      ];

      invalidNumbers.forEach((val) => {
        const result = phoneSchema.safeParse(val);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Số điện thoại không hợp lệ',
          );
        }
      });
    });
  });

  describe('emailSchema', () => {
    it('accepts valid email addresses', () => {
      expect(emailSchema.safeParse('user@example.com').success).toBe(true);
      expect(
        emailSchema.safeParse('first.last+tag@sub.domain.vn').success,
      ).toBe(true);
    });

    it('rejects invalid email formats with Vietnamese error message', () => {
      const invalidEmails = ['invalid-email', 'user@', '@example.com', ''];
      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Email không hợp lệ');
        }
      });
    });
  });

  describe('passwordSchema', () => {
    it('accepts valid passwords between 6 and 50 characters', () => {
      expect(passwordSchema.safeParse('123456').success).toBe(true);
      expect(passwordSchema.safeParse('a'.repeat(50)).success).toBe(true);
      expect(passwordSchema.safeParse('validPassword123').success).toBe(true);
    });

    it('rejects passwords shorter than 6 characters with Vietnamese error message', () => {
      const result = passwordSchema.safeParse('12345');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Mật khẩu phải có ít nhất 6 ký tự',
        );
      }
    });

    it('rejects passwords longer than 50 characters with Vietnamese error message', () => {
      const result = passwordSchema.safeParse('a'.repeat(51));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Mật khẩu không được quá 50 ký tự',
        );
      }
    });
  });

  describe('requiredString', () => {
    it('accepts non-empty strings', () => {
      const schema = requiredString('Tên');
      expect(schema.safeParse('Nguyễn Văn A').success).toBe(true);
      expect(schema.safeParse('   ').success).toBe(true);
    });

    it('rejects empty strings with dynamic fieldName error message', () => {
      const nameSchema = requiredString('Tên');
      const result = nameSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tên là bắt buộc');
      }

      const addressSchemaCustom = requiredString('Địa chỉ nhận hàng');
      const addressResult = addressSchemaCustom.safeParse('');
      expect(addressResult.success).toBe(false);
      if (!addressResult.success) {
        expect(addressResult.error.issues[0].message).toBe(
          'Địa chỉ nhận hàng là bắt buộc',
        );
      }
    });
  });

  describe('positiveNumber', () => {
    it('accepts positive numbers', () => {
      const schema = positiveNumber('Giá gốc');
      expect(schema.safeParse(1).success).toBe(true);
      expect(schema.safeParse(0.5).success).toBe(true);
      expect(schema.safeParse(100000).success).toBe(true);
    });

    it('rejects zero and negative numbers with dynamic fieldName error message', () => {
      const schema = positiveNumber('Giá gốc');

      const zeroResult = schema.safeParse(0);
      expect(zeroResult.success).toBe(false);
      if (!zeroResult.success) {
        expect(zeroResult.error.issues[0].message).toBe(
          'Giá gốc phải là số dương',
        );
      }

      const negativeResult = schema.safeParse(-100);
      expect(negativeResult.success).toBe(false);
      if (!negativeResult.success) {
        expect(negativeResult.error.issues[0].message).toBe(
          'Giá gốc phải là số dương',
        );
      }
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login data', () => {
      const data: LoginInput = {
        phone: '0987654321',
        password: 'password123',
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('rejects login data with invalid phone or short password', () => {
      const badPhone = loginSchema.safeParse({
        phone: '0987',
        password: 'password123',
      });
      expect(badPhone.success).toBe(false);
      if (!badPhone.success) {
        expect(badPhone.error.issues[0].message).toBe(
          'Số điện thoại không hợp lệ',
        );
      }

      const badPassword = loginSchema.safeParse({
        phone: '0987654321',
        password: '123',
      });
      expect(badPassword.success).toBe(false);
      if (!badPassword.success) {
        expect(badPassword.error.issues[0].message).toBe(
          'Mật khẩu phải có ít nhất 6 ký tự',
        );
      }
    });
  });

  describe('registerSchema', () => {
    const validRegistration: RegisterInput = {
      name: 'Nguyễn Văn A',
      phone: '0987654321',
      email: 'a@example.com',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      referralCode: 'REF123',
    };

    it('accepts complete registration payload', () => {
      const result = registerSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it('accepts registration with empty string email', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        email: '',
      });
      expect(result.success).toBe(true);
    });

    it('accepts registration without optional email and referralCode', () => {
      const { email, referralCode, ...minimal } = validRegistration;
      const result = registerSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it('accepts each supported special character in password (@, $, !, %, *, ?, &)', () => {
      const specialChars = ['@', '$', '!', '%', '*', '?', '&'];
      specialChars.forEach((char) => {
        const pass = `Password${char}123`;
        const res = registerSchema.safeParse({
          ...validRegistration,
          password: pass,
          confirmPassword: pass,
        });
        expect(res.success).toBe(true);
      });
    });

    it('rejects registration with empty name', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        name: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tên là bắt buộc');
      }
    });

    it('rejects registration with invalid email format', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email không hợp lệ');
      }
    });

    it('rejects password shorter than 8 characters', () => {
      const shortPass = 'Pass@1';
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: shortPass,
        confirmPassword: shortPass,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.message.includes('8 ký tự')),
        ).toBe(true);
      }
    });

    it('rejects password missing uppercase letter', () => {
      const noUpper = 'password@123';
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: noUpper,
        confirmPassword: noUpper,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes(
              'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
            ),
          ),
        ).toBe(true);
      }
    });

    it('rejects password missing lowercase letter', () => {
      const noLower = 'PASSWORD@123';
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: noLower,
        confirmPassword: noLower,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes(
              'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
            ),
          ),
        ).toBe(true);
      }
    });

    it('rejects password missing number', () => {
      const noNumber = 'Password@ABC';
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: noNumber,
        confirmPassword: noNumber,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes(
              'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
            ),
          ),
        ).toBe(true);
      }
    });

    it('rejects password missing special character', () => {
      const noSpecial = 'Password123';
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: noSpecial,
        confirmPassword: noSpecial,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes(
              'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
            ),
          ),
        ).toBe(true);
      }
    });

    it('rejects registration when confirmPassword does not match password', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'Password@123',
        confirmPassword: 'DifferentPassword@123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) =>
          i.path.includes('confirmPassword'),
        );
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('Mật khẩu xác nhận không khớp');
      }
    });
  });

  describe('forgotPasswordSchema', () => {
    it('accepts valid email', () => {
      const data: ForgotPasswordInput = { email: 'user@example.com' };
      const result = forgotPasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'bad' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email không hợp lệ');
      }
    });
  });

  describe('resetPasswordSchema', () => {
    const validReset: ResetPasswordInput = {
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123',
    };

    it('accepts valid matching reset passwords', () => {
      const result = resetPasswordSchema.safeParse(validReset);
      expect(result.success).toBe(true);
    });

    it('rejects new password shorter than 8 characters', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'P@1',
        confirmPassword: 'P@1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.message.includes('8 ký tự')),
        ).toBe(true);
      }
    });

    it('rejects new password missing special characters', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes(
              'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
            ),
          ),
        ).toBe(true);
      }
    });

    it('rejects reset password when confirmation does not match', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'NewPassword@123',
        confirmPassword: 'DifferentPassword@123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) =>
          i.path.includes('confirmPassword'),
        );
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('Mật khẩu xác nhận không khớp');
      }
    });
  });

  describe('addressSchema', () => {
    const validAddress: AddressInput = {
      fullName: 'Trần Văn B',
      phone: '0987654321',
      address: '123 Đường Lê Lợi',
      ward: 'Bến Nghé',
      district: 'Quận 1',
      province: 'TP Hồ Chí Minh',
      isDefault: true,
    };

    it('accepts valid address with isDefault', () => {
      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('accepts valid address without isDefault', () => {
      const { isDefault, ...withoutDefault } = validAddress;
      const result = addressSchema.safeParse(withoutDefault);
      expect(result.success).toBe(true);
    });

    it('rejects missing or empty required fields with exact Vietnamese error messages', () => {
      const testCases = [
        {
          data: { ...validAddress, fullName: '' },
          expectedMessage: 'Họ tên là bắt buộc',
        },
        {
          data: { ...validAddress, phone: '098' },
          expectedMessage: 'Số điện thoại không hợp lệ',
        },
        {
          data: { ...validAddress, address: '' },
          expectedMessage: 'Địa chỉ là bắt buộc',
        },
        {
          data: { ...validAddress, ward: '' },
          expectedMessage: 'Phường/Xã là bắt buộc',
        },
        {
          data: { ...validAddress, district: '' },
          expectedMessage: 'Quận/Huyện là bắt buộc',
        },
        {
          data: { ...validAddress, province: '' },
          expectedMessage: 'Tỉnh/Thành phố là bắt buộc',
        },
      ];

      testCases.forEach(({ data, expectedMessage }) => {
        const result = addressSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(
            result.error.issues.some((i) => i.message === expectedMessage),
          ).toBe(true);
        }
      });
    });
  });

  describe('productSchema', () => {
    const validProduct: ProductInput = {
      name: 'Xịt Thơm Hoa Hồng',
      slug: 'xit-thom-hoa-hong',
      description: 'Xịt thơm tự nhiên hương hoa hồng',
      categoryId: 'cat-01',
      basePrice: 120000,
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    };

    it('accepts valid product input', () => {
      const result = productSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('rejects empty strings for required product fields', () => {
      const fields: Array<[keyof ProductInput, string]> = [
        ['name', 'Tên sản phẩm là bắt buộc'],
        ['slug', 'Đường dẫn là bắt buộc'],
        ['description', 'Mô tả là bắt buộc'],
        ['categoryId', 'Danh mục là bắt buộc'],
      ];

      fields.forEach(([field, message]) => {
        const result = productSchema.safeParse({
          ...validProduct,
          [field]: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some((i) => i.message === message)).toBe(
            true,
          );
        }
      });
    });

    it('rejects non-positive basePrice with Vietnamese error message', () => {
      const zeroResult = productSchema.safeParse({
        ...validProduct,
        basePrice: 0,
      });
      expect(zeroResult.success).toBe(false);
      if (!zeroResult.success) {
        expect(zeroResult.error.issues[0].message).toBe(
          'Giá gốc phải là số dương',
        );
      }

      const negativeResult = productSchema.safeParse({
        ...validProduct,
        basePrice: -5000,
      });
      expect(negativeResult.success).toBe(false);
      if (!negativeResult.success) {
        expect(negativeResult.error.issues[0].message).toBe(
          'Giá gốc phải là số dương',
        );
      }
    });

    it('rejects empty images array with Vietnamese error message', () => {
      const result = productSchema.safeParse({
        ...validProduct,
        images: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Cần ít nhất 1 hình ảnh');
      }
    });
  });

  describe('variantSchema', () => {
    const validVariant: VariantInput = {
      scent: 'Hoa Lavender',
      volumeMl: 100,
      price: 150000,
      salePrice: 130000,
      stock: 25,
      sku: 'SKU-LAV-100',
    };

    it('accepts valid variant with optional salePrice and stock >= 0', () => {
      const result = variantSchema.safeParse(validVariant);
      expect(result.success).toBe(true);

      const zeroStockResult = variantSchema.safeParse({
        ...validVariant,
        stock: 0,
      });
      expect(zeroStockResult.success).toBe(true);

      const { salePrice, ...withoutSale } = validVariant;
      const noSaleResult = variantSchema.safeParse(withoutSale);
      expect(noSaleResult.success).toBe(true);
    });

    it('rejects missing scent or sku with Vietnamese error message', () => {
      const noScent = variantSchema.safeParse({
        ...validVariant,
        scent: '',
      });
      expect(noScent.success).toBe(false);
      if (!noScent.success) {
        expect(noScent.error.issues[0].message).toBe('Mùi hương là bắt buộc');
      }

      const noSku = variantSchema.safeParse({
        ...validVariant,
        sku: '',
      });
      expect(noSku.success).toBe(false);
      if (!noSku.success) {
        expect(noSku.error.issues[0].message).toBe('Mã SKU là bắt buộc');
      }
    });

    it('rejects non-positive volumeMl and price', () => {
      const zeroVolume = variantSchema.safeParse({
        ...validVariant,
        volumeMl: 0,
      });
      expect(zeroVolume.success).toBe(false);
      if (!zeroVolume.success) {
        expect(zeroVolume.error.issues[0].message).toBe(
          'Dung tích phải là số dương',
        );
      }

      const zeroPrice = variantSchema.safeParse({
        ...validVariant,
        price: 0,
      });
      expect(zeroPrice.success).toBe(false);
      if (!zeroPrice.success) {
        expect(zeroPrice.error.issues[0].message).toBe('Giá phải là số dương');
      }
    });

    it('rejects negative stock with Vietnamese error message', () => {
      const result = variantSchema.safeParse({
        ...validVariant,
        stock: -1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tồn kho không được âm');
      }
    });
  });

  describe('couponSchema', () => {
    const validPercentageCoupon: CouponInput = {
      code: 'GIAM10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 100000,
      maxDiscount: 50000,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      usageLimit: 100,
    };

    const validFixedCoupon: CouponInput = {
      code: 'GIAM50K',
      discountType: 'FIXED',
      discountValue: 50000,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    };

    it('accepts valid PERCENTAGE and FIXED coupons', () => {
      expect(couponSchema.safeParse(validPercentageCoupon).success).toBe(true);
      expect(couponSchema.safeParse(validFixedCoupon).success).toBe(true);
    });

    it('rejects empty coupon code with Vietnamese error message', () => {
      const result = couponSchema.safeParse({
        ...validPercentageCoupon,
        code: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Mã giảm giá là bắt buộc');
      }
    });

    it('rejects invalid discountType', () => {
      const result = couponSchema.safeParse({
        ...validPercentageCoupon,
        discountType: 'INVALID_TYPE' as any,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-positive discountValue with Vietnamese error message', () => {
      const result = couponSchema.safeParse({
        ...validPercentageCoupon,
        discountValue: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Giá trị giảm phải là số dương',
        );
      }
    });

    it('rejects negative minOrderValue or maxDiscount or usageLimit < 1', () => {
      expect(
        couponSchema.safeParse({
          ...validPercentageCoupon,
          minOrderValue: -1,
        }).success,
      ).toBe(false);

      expect(
        couponSchema.safeParse({
          ...validPercentageCoupon,
          maxDiscount: -1,
        }).success,
      ).toBe(false);

      expect(
        couponSchema.safeParse({
          ...validPercentageCoupon,
          usageLimit: 0,
        }).success,
      ).toBe(false);
    });
  });
});
