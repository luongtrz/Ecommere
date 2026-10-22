import { describe, expect, it } from 'vitest';
import {
  phoneSchema,
  emailSchema,
  passwordSchema,
  requiredString,
  positiveNumber,
  loginSchema,
  addressSchema,
  productSchema,
  variantSchema,
  couponSchema,
} from './validators';

describe('validators', () => {
  describe('phoneSchema', () => {
    it('validates 10-digit Vietnamese phone numbers starting with 0', () => {
      const result = phoneSchema.safeParse('0901234567');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('0901234567');
      }
    });

    it('validates 11-digit Vietnamese phone numbers starting with 0', () => {
      const result = phoneSchema.safeParse('01234567890');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('01234567890');
      }
    });

    it('validates Vietnamese phone numbers starting with +84 followed by 9 digits', () => {
      const result = phoneSchema.safeParse('+84901234567');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('+84901234567');
      }
    });

    it('validates Vietnamese phone numbers starting with +84 followed by 10 digits', () => {
      const result = phoneSchema.safeParse('+841234567890');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('+841234567890');
      }
    });

    it('rejects empty phone string with Vietnamese error message', () => {
      const result = phoneSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Số điện thoại không hợp lệ',
        );
      }
    });

    it('rejects numbers not starting with 0 or +84', () => {
      const result = phoneSchema.safeParse('1234567890');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Số điện thoại không hợp lệ',
        );
      }
    });

    it('rejects phone numbers that are too short', () => {
      const result = phoneSchema.safeParse('09012345');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Số điện thoại không hợp lệ',
        );
      }
    });

    it('rejects phone numbers that are too long', () => {
      const result = phoneSchema.safeParse('09012345678912');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Số điện thoại không hợp lệ',
        );
      }
    });

    it('rejects phone numbers containing letters or special characters', () => {
      const withLetters = phoneSchema.safeParse('090123456a');
      expect(withLetters.success).toBe(false);
      if (!withLetters.success) {
        expect(withLetters.error.issues[0].message).toBe(
          'Số điện thoại không hợp lệ',
        );
      }

      const withHyphens = phoneSchema.safeParse('090-123-4567');
      expect(withHyphens.success).toBe(false);
      if (!withHyphens.success) {
        expect(withHyphens.error.issues[0].message).toBe(
          'Số điện thoại không hợp lệ',
        );
      }
    });

    it('rejects non-string inputs', () => {
      expect(phoneSchema.safeParse(901234567).success).toBe(false);
      expect(phoneSchema.safeParse(null).success).toBe(false);
      expect(phoneSchema.safeParse(undefined).success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('validates a standard email address', () => {
      const result = emailSchema.safeParse('admin@thaisprayshop.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('admin@thaisprayshop.com');
      }
    });

    it('validates email addresses with subdomains and plus signs', () => {
      const result = emailSchema.safeParse('user+test@sub.example.vn');
      expect(result.success).toBe(true);
    });

    it('rejects empty email string with Vietnamese error message', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email không hợp lệ');
      }
    });

    it('rejects invalid email formats', () => {
      const invalidList = [
        'plainaddress',
        '@missinguser.com',
        'missing-domain@',
        'two@@domain.com',
        'spaces in@domain.com',
      ];

      for (const val of invalidList) {
        const result = emailSchema.safeParse(val);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Email không hợp lệ');
        }
      }
    });

    it('rejects non-string values', () => {
      expect(emailSchema.safeParse(12345).success).toBe(false);
      expect(emailSchema.safeParse(null).success).toBe(false);
      expect(emailSchema.safeParse(undefined).success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('validates password with minimum length of 6 characters', () => {
      const result = passwordSchema.safeParse('123456');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('123456');
      }
    });

    it('validates password with maximum length of 50 characters', () => {
      const password50 = 'a'.repeat(50);
      const result = passwordSchema.safeParse(password50);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(password50);
      }
    });

    it('validates complex passwords within length boundary', () => {
      const result = passwordSchema.safeParse('ThaiSpray@Pass_2026!');
      expect(result.success).toBe(true);
    });

    it('rejects passwords shorter than 6 characters with minimum length message', () => {
      const result5 = passwordSchema.safeParse('12345');
      expect(result5.success).toBe(false);
      if (!result5.success) {
        expect(result5.error.issues[0].message).toBe(
          'Mật khẩu phải có ít nhất 6 ký tự',
        );
      }

      const resultEmpty = passwordSchema.safeParse('');
      expect(resultEmpty.success).toBe(false);
      if (!resultEmpty.success) {
        expect(resultEmpty.error.issues[0].message).toBe(
          'Mật khẩu phải có ít nhất 6 ký tự',
        );
      }
    });

    it('rejects passwords longer than 50 characters with maximum length message', () => {
      const password51 = 'a'.repeat(51);
      const result = passwordSchema.safeParse(password51);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Mật khẩu không được quá 50 ký tự',
        );
      }
    });

    it('rejects non-string password inputs', () => {
      expect(passwordSchema.safeParse(123456).success).toBe(false);
      expect(passwordSchema.safeParse(null).success).toBe(false);
    });
  });

  describe('requiredString', () => {
    it('creates a schema that accepts non-empty strings', () => {
      const schema = requiredString('Họ tên');
      const result = schema.safeParse('Nguyễn Văn A');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Nguyễn Văn A');
      }
    });

    it('rejects empty string with fieldName in error message', () => {
      const nameSchema = requiredString('Họ tên');
      const result = nameSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Họ tên là bắt buộc');
      }

      const addressSchemaField = requiredString('Địa chỉ');
      const resultAddr = addressSchemaField.safeParse('');
      expect(resultAddr.success).toBe(false);
      if (!resultAddr.success) {
        expect(resultAddr.error.issues[0].message).toBe('Địa chỉ là bắt buộc');
      }
    });

    it('rejects non-string inputs', () => {
      const schema = requiredString('Tiêu đề');
      expect(schema.safeParse(null).success).toBe(false);
      expect(schema.safeParse(undefined).success).toBe(false);
      expect(schema.safeParse(123).success).toBe(false);
    });
  });

  describe('positiveNumber', () => {
    it('accepts positive integers and decimals', () => {
      const schema = positiveNumber('Giá tiền');

      const intResult = schema.safeParse(150000);
      expect(intResult.success).toBe(true);
      if (intResult.success) {
        expect(intResult.data).toBe(150000);
      }

      const floatResult = schema.safeParse(0.5);
      expect(floatResult.success).toBe(true);
      if (floatResult.success) {
        expect(floatResult.data).toBe(0.5);
      }
    });

    it('rejects 0 with fieldName in error message', () => {
      const schema = positiveNumber('Giá gốc');
      const result = schema.safeParse(0);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Giá gốc phải là số dương');
      }
    });

    it('rejects negative numbers with fieldName in error message', () => {
      const schema = positiveNumber('Dung tích');
      const result = schema.safeParse(-50);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Dung tích phải là số dương',
        );
      }
    });

    it('rejects strings, NaN, and other non-number inputs', () => {
      const schema = positiveNumber('Số lượng');
      expect(schema.safeParse('100').success).toBe(false);
      expect(schema.safeParse(NaN).success).toBe(false);
      expect(schema.safeParse(null).success).toBe(false);
      expect(schema.safeParse(undefined).success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('validates valid phone and password credentials', () => {
      const validData = {
        phone: '0987654321',
        password: 'adminPassword123',
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('rejects login data when phone is invalid', () => {
      const invalidPhone = {
        phone: '12345',
        password: 'validPassword123',
      };
      const result = loginSchema.safeParse(invalidPhone);
      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneIssue = result.error.issues.find(
          (issue) => issue.path[0] === 'phone',
        );
        expect(phoneIssue?.message).toBe('Số điện thoại không hợp lệ');
      }
    });

    it('rejects login data when password is too short', () => {
      const invalidPass = {
        phone: '0987654321',
        password: '123',
      };
      const result = loginSchema.safeParse(invalidPass);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passIssue = result.error.issues.find(
          (issue) => issue.path[0] === 'password',
        );
        expect(passIssue?.message).toBe('Mật khẩu phải có ít nhất 6 ký tự');
      }
    });

    it('rejects empty object with errors for both fields', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('addressSchema', () => {
    const validAddress = {
      fullName: 'Nguyễn Văn Nam',
      phone: '0912345678',
      address: '123 Đường Hai Bà Trưng',
      ward: 'Phường Đa Kao',
      district: 'Quận 1',
      province: 'TP. Hồ Chí Minh',
      isDefault: true,
    };

    it('validates a complete address object with isDefault true', () => {
      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validAddress);
      }
    });

    it('validates an address object with isDefault false', () => {
      const data = { ...validAddress, isDefault: false };
      const result = addressSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDefault).toBe(false);
      }
    });

    it('validates an address object without the optional isDefault field', () => {
      const { isDefault, ...dataWithoutDefault } = validAddress;
      const result = addressSchema.safeParse(dataWithoutDefault);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDefault).toBeUndefined();
      }
    });

    it('rejects address when required string fields are empty', () => {
      const invalidFields = [
        { field: 'fullName', message: 'Họ tên là bắt buộc' },
        { field: 'address', message: 'Địa chỉ là bắt buộc' },
        { field: 'ward', message: 'Phường/Xã là bắt buộc' },
        { field: 'district', message: 'Quận/Huyện là bắt buộc' },
        { field: 'province', message: 'Tỉnh/Thành phố là bắt buộc' },
      ] as const;

      for (const { field, message } of invalidFields) {
        const payload = { ...validAddress, [field]: '' };
        const result = addressSchema.safeParse(payload);
        expect(result.success).toBe(false);
        if (!result.success) {
          const issue = result.error.issues.find(
            (item) => item.path[0] === field,
          );
          expect(issue?.message).toBe(message);
        }
      }
    });

    it('rejects address when phone number is invalid', () => {
      const payload = { ...validAddress, phone: '090abc' };
      const result = addressSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneIssue = result.error.issues.find(
          (item) => item.path[0] === 'phone',
        );
        expect(phoneIssue?.message).toBe('Số điện thoại không hợp lệ');
      }
    });

    it('rejects address when isDefault is not a boolean', () => {
      const payload = { ...validAddress, isDefault: 'true' };
      const result = addressSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('productSchema', () => {
    const validProduct = {
      name: 'Chai Xịt Thơm Phòng Thái Lan Cao Cấp',
      slug: 'chai-xit-thom-phong-thai-lan-cao-cap',
      description:
        'Hương sả chanh tự nhiên giúp làm thơm phòng và xua đuổi côn trùng',
      categoryId: 'cat-spray-01',
      basePrice: 150000,
      images: [
        'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800',
        'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800',
      ],
    };

    it('validates a complete product object with multiple images', () => {
      const result = productSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validProduct);
      }
    });

    it('validates product with exactly 1 image in images array', () => {
      const productWithOneImage = {
        ...validProduct,
        images: ['https://images.unsplash.com/photo-single.jpg'],
      };
      const result = productSchema.safeParse(productWithOneImage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.images).toHaveLength(1);
      }
    });

    it('rejects empty images array with Vietnamese error message', () => {
      const emptyImages = { ...validProduct, images: [] };
      const result = productSchema.safeParse(emptyImages);
      expect(result.success).toBe(false);
      if (!result.success) {
        const imageIssue = result.error.issues.find(
          (issue) => issue.path[0] === 'images',
        );
        expect(imageIssue?.message).toBe('Cần ít nhất 1 hình ảnh');
      }
    });

    it('rejects empty required string fields with exact Vietnamese error messages', () => {
      const fields = [
        { field: 'name', message: 'Tên sản phẩm là bắt buộc' },
        { field: 'slug', message: 'Đường dẫn là bắt buộc' },
        { field: 'description', message: 'Mô tả là bắt buộc' },
        { field: 'categoryId', message: 'Danh mục là bắt buộc' },
      ] as const;

      for (const { field, message } of fields) {
        const payload = { ...validProduct, [field]: '' };
        const result = productSchema.safeParse(payload);
        expect(result.success).toBe(false);
        if (!result.success) {
          const issue = result.error.issues.find(
            (item) => item.path[0] === field,
          );
          expect(issue?.message).toBe(message);
        }
      }
    });

    it('rejects non-positive basePrice (0 or negative)', () => {
      const zeroPrice = { ...validProduct, basePrice: 0 };
      const zeroResult = productSchema.safeParse(zeroPrice);
      expect(zeroResult.success).toBe(false);
      if (!zeroResult.success) {
        const issue = zeroResult.error.issues.find(
          (item) => item.path[0] === 'basePrice',
        );
        expect(issue?.message).toBe('Giá gốc phải là số dương');
      }

      const negativePrice = { ...validProduct, basePrice: -50000 };
      const negResult = productSchema.safeParse(negativePrice);
      expect(negResult.success).toBe(false);
      if (!negResult.success) {
        const issue = negResult.error.issues.find(
          (item) => item.path[0] === 'basePrice',
        );
        expect(issue?.message).toBe('Giá gốc phải là số dương');
      }
    });

    it('rejects images containing non-string items', () => {
      const payload = { ...validProduct, images: [123 as unknown as string] };
      const result = productSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('variantSchema', () => {
    const validVariant = {
      scent: 'Hoa Nhài',
      volumeMl: 100,
      price: 120000,
      salePrice: 99000,
      stock: 50,
      sku: 'SPRAY-JASMINE-100ML',
    };

    it('validates variant with all fields including optional salePrice', () => {
      const result = variantSchema.safeParse(validVariant);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validVariant);
      }
    });

    it('validates variant without optional salePrice', () => {
      const { salePrice, ...dataWithoutSale } = validVariant;
      const result = variantSchema.safeParse(dataWithoutSale);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.salePrice).toBeUndefined();
      }
    });

    it('accepts stock value of 0', () => {
      const zeroStock = { ...validVariant, stock: 0 };
      const result = variantSchema.safeParse(zeroStock);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stock).toBe(0);
      }
    });

    it('rejects negative stock with Vietnamese error message', () => {
      const negStock = { ...validVariant, stock: -1 };
      const result = variantSchema.safeParse(negStock);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (item) => item.path[0] === 'stock',
        );
        expect(issue?.message).toBe('Tồn kho không được âm');
      }
    });

    it('rejects non-positive volumeMl (0 or negative)', () => {
      const zeroVolume = { ...validVariant, volumeMl: 0 };
      const zeroResult = variantSchema.safeParse(zeroVolume);
      expect(zeroResult.success).toBe(false);
      if (!zeroResult.success) {
        const issue = zeroResult.error.issues.find(
          (item) => item.path[0] === 'volumeMl',
        );
        expect(issue?.message).toBe('Dung tích phải là số dương');
      }

      const negVolume = { ...validVariant, volumeMl: -100 };
      const negResult = variantSchema.safeParse(negVolume);
      expect(negResult.success).toBe(false);
      if (!negResult.success) {
        const issue = negResult.error.issues.find(
          (item) => item.path[0] === 'volumeMl',
        );
        expect(issue?.message).toBe('Dung tích phải là số dương');
      }
    });

    it('rejects non-positive price (0 or negative)', () => {
      const zeroPrice = { ...validVariant, price: 0 };
      const zeroResult = variantSchema.safeParse(zeroPrice);
      expect(zeroResult.success).toBe(false);
      if (!zeroResult.success) {
        const issue = zeroResult.error.issues.find(
          (item) => item.path[0] === 'price',
        );
        expect(issue?.message).toBe('Giá phải là số dương');
      }

      const negPrice = { ...validVariant, price: -20000 };
      const negResult = variantSchema.safeParse(negPrice);
      expect(negResult.success).toBe(false);
      if (!negResult.success) {
        const issue = negResult.error.issues.find(
          (item) => item.path[0] === 'price',
        );
        expect(issue?.message).toBe('Giá phải là số dương');
      }
    });

    it('rejects empty scent string with Vietnamese error message', () => {
      const emptyScent = { ...validVariant, scent: '' };
      const result = variantSchema.safeParse(emptyScent);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (item) => item.path[0] === 'scent',
        );
        expect(issue?.message).toBe('Mùi hương là bắt buộc');
      }
    });

    it('rejects empty SKU string with Vietnamese error message', () => {
      const emptySku = { ...validVariant, sku: '' };
      const result = variantSchema.safeParse(emptySku);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (item) => item.path[0] === 'sku',
        );
        expect(issue?.message).toBe('SKU là bắt buộc');
      }
    });
  });

  describe('couponSchema', () => {
    const validPercentageCoupon = {
      code: 'SUMMER2026',
      discountType: 'PERCENTAGE' as const,
      discountValue: 15,
      minOrderValue: 200000,
      maxDiscount: 50000,
      startDate: '2026-06-01T00:00:00Z',
      endDate: '2026-06-30T23:59:59Z',
      usageLimit: 100,
    };

    const validFixedCoupon = {
      code: 'GIAM50K',
      discountType: 'FIXED' as const,
      discountValue: 50000,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    };

    it('validates PERCENTAGE coupon with all optional fields', () => {
      const result = couponSchema.safeParse(validPercentageCoupon);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPercentageCoupon);
      }
    });

    it('validates FIXED coupon without optional fields (minOrderValue, maxDiscount, usageLimit)', () => {
      const result = couponSchema.safeParse(validFixedCoupon);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validFixedCoupon);
        expect(result.data.minOrderValue).toBeUndefined();
        expect(result.data.maxDiscount).toBeUndefined();
        expect(result.data.usageLimit).toBeUndefined();
      }
    });

    it('validates boundary values for optional fields (minOrderValue 0, maxDiscount 0, usageLimit 1)', () => {
      const boundaryCoupon = {
        ...validFixedCoupon,
        minOrderValue: 0,
        maxDiscount: 0,
        usageLimit: 1,
      };
      const result = couponSchema.safeParse(boundaryCoupon);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minOrderValue).toBe(0);
        expect(result.data.maxDiscount).toBe(0);
        expect(result.data.usageLimit).toBe(1);
      }
    });

    it('rejects empty coupon code with Vietnamese error message', () => {
      const emptyCode = { ...validPercentageCoupon, code: '' };
      const result = couponSchema.safeParse(emptyCode);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (item) => item.path[0] === 'code',
        );
        expect(issue?.message).toBe('Mã giảm giá là bắt buộc');
      }
    });

    it('rejects invalid discountType values outside enum', () => {
      const invalidType = {
        ...validPercentageCoupon,
        discountType: 'BUY_1_GET_1',
      };
      const result = couponSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
    });

    it('rejects non-positive discountValue (0 or negative) with Vietnamese error message', () => {
      const zeroDiscount = { ...validPercentageCoupon, discountValue: 0 };
      const zeroResult = couponSchema.safeParse(zeroDiscount);
      expect(zeroResult.success).toBe(false);
      if (!zeroResult.success) {
        const issue = zeroResult.error.issues.find(
          (item) => item.path[0] === 'discountValue',
        );
        expect(issue?.message).toBe('Giá trị giảm phải là số dương');
      }

      const negDiscount = { ...validPercentageCoupon, discountValue: -15 };
      const negResult = couponSchema.safeParse(negDiscount);
      expect(negResult.success).toBe(false);
      if (!negResult.success) {
        const issue = negResult.error.issues.find(
          (item) => item.path[0] === 'discountValue',
        );
        expect(issue?.message).toBe('Giá trị giảm phải là số dương');
      }
    });

    it('rejects negative minOrderValue', () => {
      const negMinOrder = { ...validPercentageCoupon, minOrderValue: -1 };
      const result = couponSchema.safeParse(negMinOrder);
      expect(result.success).toBe(false);
    });

    it('rejects negative maxDiscount', () => {
      const negMaxDiscount = { ...validPercentageCoupon, maxDiscount: -1 };
      const result = couponSchema.safeParse(negMaxDiscount);
      expect(result.success).toBe(false);
    });

    it('rejects usageLimit less than 1 (0 or negative)', () => {
      const zeroLimit = { ...validPercentageCoupon, usageLimit: 0 };
      const zeroResult = couponSchema.safeParse(zeroLimit);
      expect(zeroResult.success).toBe(false);

      const negLimit = { ...validPercentageCoupon, usageLimit: -5 };
      const negResult = couponSchema.safeParse(negLimit);
      expect(negResult.success).toBe(false);
    });

    it('rejects coupon when startDate or endDate is missing', () => {
      const { startDate, ...missingStart } = validFixedCoupon;
      expect(couponSchema.safeParse(missingStart).success).toBe(false);

      const { endDate, ...missingEnd } = validFixedCoupon;
      expect(couponSchema.safeParse(missingEnd).success).toBe(false);
    });
  });
});
