import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CheckoutDto, CheckoutItemDto, ShippingMethod } from './checkout.dto';

describe('Checkout DTOs', () => {
  describe('ShippingMethod enum', () => {
    it('should have expected enum values', () => {
      expect(ShippingMethod.STANDARD).toBe('STANDARD');
      expect(ShippingMethod.EXPRESS).toBe('EXPRESS');
    });
  });

  describe('CheckoutItemDto', () => {
    describe('instantiation', () => {
      it('should instantiate directly and set properties', () => {
        const item = new CheckoutItemDto();
        item.variantId = 'variant-uuid-1';
        item.quantity = 3;
        item.price = 150000;

        expect(item).toBeDefined();
        expect(item).toBeInstanceOf(CheckoutItemDto);
        expect(item.variantId).toBe('variant-uuid-1');
        expect(item.quantity).toBe(3);
        expect(item.price).toBe(150000);
      });
    });

    describe('validation - success scenarios', () => {
      it('should pass validation with valid required fields', async () => {
        const item = plainToInstance(CheckoutItemDto, {
          variantId: 'variant-1',
          quantity: 2,
        });

        const errors = await validate(item);
        expect(errors).toHaveLength(0);
        expect(item.variantId).toBe('variant-1');
        expect(item.quantity).toBe(2);
        expect(item.price).toBeUndefined();
      });

      it('should pass validation with valid required fields and optional price', async () => {
        const item = plainToInstance(CheckoutItemDto, {
          variantId: 'variant-1',
          quantity: 1,
          price: 99000,
        });

        const errors = await validate(item);
        expect(errors).toHaveLength(0);
        expect(item.price).toBe(99000);
      });

      it('should allow price=0 as valid numeric price', async () => {
        const item = plainToInstance(CheckoutItemDto, {
          variantId: 'variant-1',
          quantity: 1,
          price: 0,
        });

        const errors = await validate(item);
        expect(errors).toHaveLength(0);
        expect(item.price).toBe(0);
      });

      it('should transform numeric string quantity and price via @Type(() => Number)', async () => {
        const item = plainToInstance(CheckoutItemDto, {
          variantId: 'variant-1',
          quantity: '5',
          price: '250000',
        });

        expect(item.quantity).toBe(5);
        expect(typeof item.quantity).toBe('number');
        expect(item.price).toBe(250000);
        expect(typeof item.price).toBe('number');

        const errors = await validate(item);
        expect(errors).toHaveLength(0);
      });

      it('should accept boundary minimum quantity (quantity=1)', async () => {
        const item = plainToInstance(CheckoutItemDto, {
          variantId: 'variant-min',
          quantity: 1,
        });

        const errors = await validate(item);
        expect(errors).toHaveLength(0);
      });
    });

    describe('validation - failure scenarios', () => {
      describe('variantId validation failures', () => {
        it('should fail validation when variantId is missing', async () => {
          const item = plainToInstance(CheckoutItemDto, {
            quantity: 2,
          });

          const errors = await validate(item);
          expect(errors.length).toBeGreaterThan(0);
          const varError = errors.find((e) => e.property === 'variantId');
          expect(varError).toBeDefined();
          expect(varError?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when variantId is not a string', async () => {
          const item = plainToInstance(CheckoutItemDto, {
            variantId: 12345,
            quantity: 2,
          });

          const errors = await validate(item);
          const varError = errors.find((e) => e.property === 'variantId');
          expect(varError).toBeDefined();
          expect(varError?.constraints).toHaveProperty('isString');
        });
      });

      describe('quantity validation failures', () => {
        it('should fail validation when quantity is missing', async () => {
          const item = plainToInstance(CheckoutItemDto, {
            variantId: 'variant-1',
          });

          const errors = await validate(item);
          expect(errors.length).toBeGreaterThan(0);
          const qtyError = errors.find((e) => e.property === 'quantity');
          expect(qtyError).toBeDefined();
        });

        it('should fail validation when quantity is 0 (< 1)', async () => {
          const item = plainToInstance(CheckoutItemDto, {
            variantId: 'variant-1',
            quantity: 0,
          });

          const errors = await validate(item);
          const qtyError = errors.find((e) => e.property === 'quantity');
          expect(qtyError).toBeDefined();
          expect(qtyError?.constraints).toHaveProperty('min');
        });

        it('should fail validation when quantity is negative', async () => {
          const item = plainToInstance(CheckoutItemDto, {
            variantId: 'variant-1',
            quantity: -3,
          });

          const errors = await validate(item);
          const qtyError = errors.find((e) => e.property === 'quantity');
          expect(qtyError).toBeDefined();
          expect(qtyError?.constraints).toHaveProperty('min');
        });

        it('should fail validation when quantity is a float', async () => {
          const item = plainToInstance(CheckoutItemDto, {
            variantId: 'variant-1',
            quantity: 1.5,
          });

          const errors = await validate(item);
          const qtyError = errors.find((e) => e.property === 'quantity');
          expect(qtyError).toBeDefined();
          expect(qtyError?.constraints).toHaveProperty('isInt');
        });

        it('should fail validation when quantity is a non-numeric string', async () => {
          const item = plainToInstance(CheckoutItemDto, {
            variantId: 'variant-1',
            quantity: 'invalid',
          });

          const errors = await validate(item);
          const qtyError = errors.find((e) => e.property === 'quantity');
          expect(qtyError).toBeDefined();
          expect(qtyError?.constraints).toHaveProperty('isInt');
        });
      });

      describe('price validation failures', () => {
        it('should fail validation when price is a non-numeric string', async () => {
          const item = plainToInstance(CheckoutItemDto, {
            variantId: 'variant-1',
            quantity: 1,
            price: 'not-a-number',
          });

          const errors = await validate(item);
          const priceError = errors.find((e) => e.property === 'price');
          expect(priceError).toBeDefined();
          expect(priceError?.constraints).toHaveProperty('isNumber');
        });

        it('should fail validation when price is an object', async () => {
          const item = plainToInstance(CheckoutItemDto, {
            variantId: 'variant-1',
            quantity: 1,
            price: { amount: 100 },
          });

          const errors = await validate(item);
          const priceError = errors.find((e) => e.property === 'price');
          expect(priceError).toBeDefined();
          expect(priceError?.constraints).toHaveProperty('isNumber');
        });
      });
    });
  });

  describe('CheckoutDto', () => {
    describe('instantiation', () => {
      it('should instantiate directly and set properties', () => {
        const dto = new CheckoutDto();
        dto.addressId = 'addr-001';
        dto.fullName = 'Nguyen Van A';
        dto.phone = '0912345678';
        dto.province = 'Ho Chi Minh';
        dto.district = 'Quan 1';
        dto.ward = 'Phuong Ben Nghe';
        dto.line1 = '123 Le Loi';
        dto.paymentMethod = 'COD';
        dto.shippingMethod = ShippingMethod.STANDARD;
        dto.shippingFee = 30000;
        dto.total = 230000;
        dto.checkoutKey = 'checkout-key-12345678';

        const item = new CheckoutItemDto();
        item.variantId = 'var-1';
        item.quantity = 2;
        dto.items = [item];

        dto.shippingAddress = {
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          address: '123 Le Loi',
          ward: 'Phuong Ben Nghe',
          district: 'Quan 1',
          province: 'Ho Chi Minh',
        };

        expect(dto).toBeDefined();
        expect(dto).toBeInstanceOf(CheckoutDto);
        expect(dto.addressId).toBe('addr-001');
        expect(dto.fullName).toBe('Nguyen Van A');
        expect(dto.phone).toBe('0912345678');
        expect(dto.province).toBe('Ho Chi Minh');
        expect(dto.district).toBe('Quan 1');
        expect(dto.ward).toBe('Phuong Ben Nghe');
        expect(dto.line1).toBe('123 Le Loi');
        expect(dto.paymentMethod).toBe('COD');
        expect(dto.shippingMethod).toBe(ShippingMethod.STANDARD);
        expect(dto.shippingFee).toBe(30000);
        expect(dto.total).toBe(230000);
        expect(dto.checkoutKey).toBe('checkout-key-12345678');
        expect(dto.items).toHaveLength(1);
        expect(dto.items![0].variantId).toBe('var-1');
        expect(dto.shippingAddress?.fullName).toBe('Nguyen Van A');
      });
    });

    describe('validation - success scenarios', () => {
      it('should pass validation with empty plain object (all fields are optional)', async () => {
        const dto = plainToInstance(CheckoutDto, {});
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should pass validation with default instantiation', async () => {
        const dto = new CheckoutDto();
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should pass validation with all fields populated validly', async () => {
        const payload = {
          addressId: 'address-id-123',
          fullName: 'Tran Thi B',
          phone: '0987654321',
          province: 'Ha Noi',
          district: 'Hoan Kiem',
          ward: 'Hang Bac',
          line1: '456 Pho Hue',
          paymentMethod: 'VNPAY',
          shippingAddress: {
            fullName: 'Tran Thi B',
            phone: '0987654321',
            address: '456 Pho Hue',
            ward: 'Hang Bac',
            district: 'Hoan Kiem',
            province: 'Ha Noi',
          },
          shippingMethod: ShippingMethod.EXPRESS,
          shippingFee: 50000,
          total: 350000,
          checkoutKey: 'valid-checkout-key-1234',
          items: [
            { variantId: 'variant-a', quantity: 1, price: 100000 },
            { variantId: 'variant-b', quantity: 2, price: 100000 },
          ],
        };

        const dto = plainToInstance(CheckoutDto, payload);

        expect(dto.items).toBeDefined();
        expect(dto.items).toHaveLength(2);
        expect(dto.items![0]).toBeInstanceOf(CheckoutItemDto);
        expect(dto.items![1]).toBeInstanceOf(CheckoutItemDto);

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it.each(Object.values(ShippingMethod))(
        'should accept valid ShippingMethod enum: %s',
        async (shippingMethod) => {
          const dto = plainToInstance(CheckoutDto, { shippingMethod });

          expect(dto.shippingMethod).toBe(shippingMethod);
          const errors = await validate(dto);
          expect(errors).toHaveLength(0);
        },
      );

      it('should accept empty items array', async () => {
        const dto = plainToInstance(CheckoutDto, { items: [] });

        expect(dto.items).toEqual([]);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept boundary values for checkoutKey: 8 chars (min) and 64 chars (max)', async () => {
        const dtoMin = plainToInstance(CheckoutDto, {
          checkoutKey: '12345678', // exactly 8 characters
        });
        const errorsMin = await validate(dtoMin);
        expect(errorsMin).toHaveLength(0);

        const dtoMax = plainToInstance(CheckoutDto, {
          checkoutKey: 'a'.repeat(64), // exactly 64 characters
        });
        const errorsMax = await validate(dtoMax);
        expect(errorsMax).toHaveLength(0);
      });

      it('should accept zero for numeric fields (shippingFee and total)', async () => {
        const dto = plainToInstance(CheckoutDto, {
          shippingFee: 0,
          total: 0,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should accept explicitly undefined values for all optional fields', async () => {
        const dto = plainToInstance(CheckoutDto, {
          addressId: undefined,
          fullName: undefined,
          phone: undefined,
          province: undefined,
          district: undefined,
          ward: undefined,
          line1: undefined,
          items: undefined,
          paymentMethod: undefined,
          shippingAddress: undefined,
          shippingMethod: undefined,
          shippingFee: undefined,
          total: undefined,
          checkoutKey: undefined,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });
    });

    describe('validation - failure scenarios', () => {
      describe('address string fields', () => {
        it('should fail validation when addressId is not a string', async () => {
          const dto = plainToInstance(CheckoutDto, { addressId: 12345 });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'addressId');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when fullName is not a string', async () => {
          const dto = plainToInstance(CheckoutDto, { fullName: 12345 });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'fullName');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when phone is not a string', async () => {
          const dto = plainToInstance(CheckoutDto, { phone: 912345678 });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'phone');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when province is not a string', async () => {
          const dto = plainToInstance(CheckoutDto, { province: true });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'province');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when district is not a string', async () => {
          const dto = plainToInstance(CheckoutDto, { district: ['Quan 1'] });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'district');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when ward is not a string', async () => {
          const dto = plainToInstance(CheckoutDto, {
            ward: { name: 'Ben Nghe' },
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'ward');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when line1 is not a string', async () => {
          const dto = plainToInstance(CheckoutDto, { line1: 123 });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'line1');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when paymentMethod is not a string', async () => {
          const dto = plainToInstance(CheckoutDto, { paymentMethod: true });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'paymentMethod');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isString');
        });
      });

      describe('items validation failures', () => {
        it('should fail validation when items is not an array', async () => {
          const dto = plainToInstance(CheckoutDto, { items: 'not-an-array' });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'items');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isArray');
        });

        it('should fail nested validation when an item inside items is invalid', async () => {
          const dto = plainToInstance(CheckoutDto, {
            items: [
              {
                variantId: 'valid-id',
                quantity: 0, // invalid, min(1)
              },
            ],
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);
          const itemsError = errors.find((e) => e.property === 'items');
          expect(itemsError).toBeDefined();
          expect(itemsError?.children).toBeDefined();
          expect(itemsError?.children?.length).toBeGreaterThan(0);

          const childQuantityError = itemsError?.children?.[0]?.children?.find(
            (c) => c.property === 'quantity',
          );
          expect(childQuantityError).toBeDefined();
          expect(childQuantityError?.constraints).toHaveProperty('min');
        });

        it('should fail nested validation when an item inside items has invalid variantId', async () => {
          const dto = plainToInstance(CheckoutDto, {
            items: [
              {
                variantId: 12345, // invalid, must be string
                quantity: 2,
              },
            ],
          });

          const errors = await validate(dto);
          const itemsError = errors.find((e) => e.property === 'items');
          expect(itemsError).toBeDefined();
          const childVariantError = itemsError?.children?.[0]?.children?.find(
            (c) => c.property === 'variantId',
          );
          expect(childVariantError).toBeDefined();
          expect(childVariantError?.constraints).toHaveProperty('isString');
        });
      });

      describe('shippingAddress validation failures', () => {
        it('should fail validation when shippingAddress is a string', async () => {
          const dto = plainToInstance(CheckoutDto, {
            shippingAddress: '123 Le Loi, Ben Nghe, Q1, HCM',
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'shippingAddress');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isObject');
        });

        it('should fail validation when shippingAddress is a number', async () => {
          const dto = plainToInstance(CheckoutDto, {
            shippingAddress: 12345,
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'shippingAddress');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isObject');
        });

        it('should fail validation when shippingAddress is a boolean', async () => {
          const dto = plainToInstance(CheckoutDto, {
            shippingAddress: true,
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'shippingAddress');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isObject');
        });
      });

      describe('shippingMethod validation failures', () => {
        it('should fail validation when shippingMethod is not a valid enum value', async () => {
          const dto = plainToInstance(CheckoutDto, {
            shippingMethod: 'OVERNIGHT',
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'shippingMethod');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isEnum');
        });

        it('should fail validation when shippingMethod is lowercase', async () => {
          const dto = plainToInstance(CheckoutDto, {
            shippingMethod: 'standard',
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'shippingMethod');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isEnum');
        });

        it('should fail validation when shippingMethod is a number', async () => {
          const dto = plainToInstance(CheckoutDto, {
            shippingMethod: 1,
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'shippingMethod');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isEnum');
        });
      });

      describe('shippingFee validation failures', () => {
        it('should fail validation when shippingFee is a non-numeric string', async () => {
          const dto = plainToInstance(CheckoutDto, {
            shippingFee: 'free',
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'shippingFee');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isNumber');
        });

        it('should fail validation when shippingFee is an object', async () => {
          const dto = plainToInstance(CheckoutDto, {
            shippingFee: { amount: 50000 },
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'shippingFee');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isNumber');
        });
      });

      describe('total validation failures', () => {
        it('should fail validation when total is a non-numeric string', async () => {
          const dto = plainToInstance(CheckoutDto, {
            total: 'three-hundred-thousand',
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'total');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isNumber');
        });

        it('should fail validation when total is an array', async () => {
          const dto = plainToInstance(CheckoutDto, {
            total: [305000],
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'total');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isNumber');
        });
      });

      describe('checkoutKey validation failures', () => {
        it('should fail validation when checkoutKey is not a string', async () => {
          const dto = plainToInstance(CheckoutDto, {
            checkoutKey: 12345678,
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'checkoutKey');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when checkoutKey length is less than 8 characters (7 chars)', async () => {
          const dto = plainToInstance(CheckoutDto, {
            checkoutKey: '1234567',
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'checkoutKey');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('minLength');
        });

        it('should fail validation when checkoutKey is an empty string', async () => {
          const dto = plainToInstance(CheckoutDto, {
            checkoutKey: '',
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'checkoutKey');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('minLength');
        });

        it('should fail validation when checkoutKey length exceeds 64 characters (65 chars)', async () => {
          const dto = plainToInstance(CheckoutDto, {
            checkoutKey: 'a'.repeat(65),
          });
          const errors = await validate(dto);
          const err = errors.find((e) => e.property === 'checkoutKey');
          expect(err).toBeDefined();
          expect(err?.constraints).toHaveProperty('maxLength');
        });
      });
    });
  });
});
