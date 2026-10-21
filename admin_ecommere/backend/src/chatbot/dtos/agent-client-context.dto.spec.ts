import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  AgentCartItemDto,
  AgentClientContextDto,
} from './agent-client-context.dto';

describe('AgentClientContextDto & AgentCartItemDto', () => {
  describe('AgentCartItemDto', () => {
    describe('Valid cases', () => {
      it('validates minimal required fields (variantId, quantity)', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 'variant-123',
          quantity: 2,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('validates fully populated fields with valid data', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 'variant-456',
          quantity: 10,
          price: 250000,
          name: 'Thai Perfume 50ml',
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('validates boundary values: variantId (1..64), quantity (1..99), price (0), name (1..200)', async () => {
        const minDto = plainToInstance(AgentCartItemDto, {
          variantId: 'v',
          quantity: 1,
          price: 0,
          name: 'P',
        });
        const minErrors = await validate(minDto);
        expect(minErrors).toHaveLength(0);

        const maxDto = plainToInstance(AgentCartItemDto, {
          variantId: 'a'.repeat(64),
          quantity: 99,
          price: 100000000,
          name: 'b'.repeat(200),
        });
        const maxErrors = await validate(maxDto);
        expect(maxErrors).toHaveLength(0);
      });

      it('supports direct class instantiation', async () => {
        const dto = new AgentCartItemDto();
        dto.variantId = 'var-direct';
        dto.quantity = 3;
        dto.price = 50000;
        dto.name = 'Direct Product';

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });
    });

    describe('variantId validation', () => {
      it('fails when variantId is missing or undefined', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          quantity: 1,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const err = errors.find((e) => e.property === 'variantId');
        expect(err).toBeDefined();
        expect(err!.constraints).toHaveProperty('isNotEmpty');
      });

      it('fails when variantId is an empty string', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: '',
          quantity: 1,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const err = errors.find((e) => e.property === 'variantId');
        expect(err).toBeDefined();
        expect(err!.constraints).toHaveProperty('isNotEmpty');
      });

      it('fails when variantId is not a string', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 12345 as any,
          quantity: 1,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const err = errors.find((e) => e.property === 'variantId');
        expect(err).toBeDefined();
        expect(err!.constraints).toHaveProperty('isString');
      });

      it('fails when variantId exceeds 64 characters', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 'a'.repeat(65),
          quantity: 1,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const err = errors.find((e) => e.property === 'variantId');
        expect(err).toBeDefined();
        expect(err!.constraints).toHaveProperty('maxLength');
      });
    });

    describe('quantity validation', () => {
      it('fails when quantity is missing or undefined', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const err = errors.find((e) => e.property === 'quantity');
        expect(err).toBeDefined();
        expect(err!.constraints).toHaveProperty('isInt');
      });

      it('fails when quantity is not an integer (float or string)', async () => {
        const floatDto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
          quantity: 2.5,
        });
        const floatErrors = await validate(floatDto);
        expect(floatErrors.length).toBeGreaterThan(0);
        expect(
          floatErrors.find((e) => e.property === 'quantity')?.constraints,
        ).toHaveProperty('isInt');

        const strDto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
          quantity: '5' as any,
        });
        const strErrors = await validate(strDto);
        expect(strErrors.length).toBeGreaterThan(0);
        expect(
          strErrors.find((e) => e.property === 'quantity')?.constraints,
        ).toHaveProperty('isInt');
      });

      it('fails when quantity is less than 1', async () => {
        const zeroDto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
          quantity: 0,
        });
        const zeroErrors = await validate(zeroDto);
        expect(zeroErrors.length).toBeGreaterThan(0);
        expect(
          zeroErrors.find((e) => e.property === 'quantity')?.constraints,
        ).toHaveProperty('min');

        const negDto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
          quantity: -3,
        });
        const negErrors = await validate(negDto);
        expect(negErrors.length).toBeGreaterThan(0);
        expect(
          negErrors.find((e) => e.property === 'quantity')?.constraints,
        ).toHaveProperty('min');
      });

      it('fails when quantity exceeds 99', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
          quantity: 100,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.find((e) => e.property === 'quantity')?.constraints,
        ).toHaveProperty('max');
      });
    });

    describe('price validation', () => {
      it('allows price to be undefined (optional)', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
          quantity: 1,
          price: undefined,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('fails when price is not an integer', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
          quantity: 1,
          price: 99.99,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.find((e) => e.property === 'price')?.constraints,
        ).toHaveProperty('isInt');
      });

      it('fails when price is negative', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
          quantity: 1,
          price: -1,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.find((e) => e.property === 'price')?.constraints,
        ).toHaveProperty('min');
      });
    });

    describe('name validation', () => {
      it('allows name to be undefined (optional)', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
          quantity: 1,
          name: undefined,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('fails when name is not a string', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
          quantity: 1,
          name: 12345 as any,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.find((e) => e.property === 'name')?.constraints,
        ).toHaveProperty('isString');
      });

      it('fails when name exceeds 200 characters', async () => {
        const dto = plainToInstance(AgentCartItemDto, {
          variantId: 'v-1',
          quantity: 1,
          name: 'c'.repeat(201),
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.find((e) => e.property === 'name')?.constraints,
        ).toHaveProperty('maxLength');
      });
    });
  });

  describe('AgentClientContextDto', () => {
    describe('Valid cases', () => {
      it('validates an empty object (all properties optional)', async () => {
        const dto = plainToInstance(AgentClientContextDto, {});
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('validates when only currentPath is provided', async () => {
        const dto = plainToInstance(AgentClientContextDto, {
          currentPath: '/products/perfume-a',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('validates boundary values for currentPath (starts with /, length 1 and 200)', async () => {
        const minPathDto = plainToInstance(AgentClientContextDto, {
          currentPath: '/',
        });
        expect(await validate(minPathDto)).toHaveLength(0);

        const maxPathDto = plainToInstance(AgentClientContextDto, {
          currentPath: '/' + 'x'.repeat(199),
        });
        expect(await validate(maxPathDto)).toHaveLength(0);
      });

      it('validates when only cart is provided with valid items', async () => {
        const dto = plainToInstance(AgentClientContextDto, {
          cart: [
            {
              variantId: 'v-1',
              quantity: 2,
              price: 150000,
              name: 'Item 1',
            },
          ],
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('validates boundary for cart: up to 100 items', async () => {
        const cartItems = Array.from({ length: 100 }, (_, i) => ({
          variantId: `v-${i + 1}`,
          quantity: 1,
        }));

        const dto = plainToInstance(AgentClientContextDto, {
          cart: cartItems,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('validates both cart and currentPath populated', async () => {
        const dto = plainToInstance(AgentClientContextDto, {
          cart: [{ variantId: 'v-1', quantity: 1 }],
          currentPath: '/cart',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('transforms nested cart plain objects into AgentCartItemDto instances via @Type', () => {
        const plainData = {
          cart: [
            {
              variantId: 'v-type-check',
              quantity: 5,
              price: 120000,
            },
          ],
          currentPath: '/checkout',
        };

        const dto = plainToInstance(AgentClientContextDto, plainData);
        expect(dto.cart).toBeDefined();
        expect(dto.cart).toHaveLength(1);
        expect(dto.cart![0]).toBeInstanceOf(AgentCartItemDto);
        expect(dto.cart![0].variantId).toBe('v-type-check');
        expect(dto.cart![0].quantity).toBe(5);
        expect(dto.cart![0].price).toBe(120000);
      });

      it('supports direct class instantiation of AgentClientContextDto', async () => {
        const item = new AgentCartItemDto();
        item.variantId = 'v-direct';
        item.quantity = 1;

        const context = new AgentClientContextDto();
        context.cart = [item];
        context.currentPath = '/home';

        const errors = await validate(context);
        expect(errors).toHaveLength(0);
      });
    });

    describe('currentPath validation', () => {
      it('fails when currentPath is not a string', async () => {
        const dto = plainToInstance(AgentClientContextDto, {
          currentPath: 12345 as any,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.find((e) => e.property === 'currentPath')?.constraints,
        ).toHaveProperty('isString');
      });

      it('fails when currentPath does not start with /', async () => {
        const noSlashDto = plainToInstance(AgentClientContextDto, {
          currentPath: 'products/perfume-a',
        });
        const noSlashErrors = await validate(noSlashDto);
        expect(noSlashErrors.length).toBeGreaterThan(0);
        expect(
          noSlashErrors.find((e) => e.property === 'currentPath')?.constraints,
        ).toHaveProperty('matches');

        const emptyDto = plainToInstance(AgentClientContextDto, {
          currentPath: '',
        });
        const emptyErrors = await validate(emptyDto);
        expect(emptyErrors.length).toBeGreaterThan(0);
        expect(
          emptyErrors.find((e) => e.property === 'currentPath')?.constraints,
        ).toHaveProperty('matches');

        const urlDto = plainToInstance(AgentClientContextDto, {
          currentPath: 'https://example.com/products',
        });
        const urlErrors = await validate(urlDto);
        expect(urlErrors.length).toBeGreaterThan(0);
        expect(
          urlErrors.find((e) => e.property === 'currentPath')?.constraints,
        ).toHaveProperty('matches');
      });

      it('fails when currentPath exceeds 200 characters', async () => {
        const dto = plainToInstance(AgentClientContextDto, {
          currentPath: '/' + 'x'.repeat(200), // length 201
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.find((e) => e.property === 'currentPath')?.constraints,
        ).toHaveProperty('maxLength');
      });
    });

    describe('cart validation', () => {
      it('fails when cart is not an array', async () => {
        const strCartDto = plainToInstance(AgentClientContextDto, {
          cart: 'not-an-array' as any,
        });
        const strErrors = await validate(strCartDto);
        expect(strErrors.length).toBeGreaterThan(0);
        expect(
          strErrors.find((e) => e.property === 'cart')?.constraints,
        ).toHaveProperty('isArray');

        const objCartDto = plainToInstance(AgentClientContextDto, {
          cart: { variantId: 'v-1', quantity: 1 } as any,
        });
        const objErrors = await validate(objCartDto);
        expect(objErrors.length).toBeGreaterThan(0);
        expect(
          objErrors.find((e) => e.property === 'cart')?.constraints,
        ).toHaveProperty('isArray');
      });

      it('fails when cart exceeds 100 items', async () => {
        const cartItems = Array.from({ length: 101 }, (_, i) => ({
          variantId: `v-${i + 1}`,
          quantity: 1,
        }));

        const dto = plainToInstance(AgentClientContextDto, {
          cart: cartItems,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.find((e) => e.property === 'cart')?.constraints,
        ).toHaveProperty('arrayMaxSize');
      });

      it('fails when cart contains nested invalid items (validateNested)', async () => {
        const dto = plainToInstance(AgentClientContextDto, {
          cart: [
            {
              variantId: '',
              quantity: 0,
            },
          ],
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const cartError = errors.find((e) => e.property === 'cart');
        expect(cartError).toBeDefined();
        expect(cartError!.children).toBeDefined();
        expect(cartError!.children!.length).toBeGreaterThan(0);
      });
    });
  });
});
