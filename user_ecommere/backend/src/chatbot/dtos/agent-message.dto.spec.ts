import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SendAgentMessageDto } from './agent-message.dto';
import { AgentClientContextDto } from './agent-client-context.dto';

describe('SendAgentMessageDto', () => {
  describe('prompt transform', () => {
    it('should trim string prompt whitespace (branch: typeof value === "string")', () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: '  Recommend a fresh fragrance for summer  ',
      });

      expect(dto.prompt).toBe('Recommend a fresh fragrance for summer');
    });

    it('should leave non-whitespace string unchanged', () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Lavender',
      });

      expect(dto.prompt).toBe('Lavender');
    });

    it('should return non-string value as-is (branch: typeof value !== "string")', () => {
      const numberDto = plainToInstance(SendAgentMessageDto, {
        prompt: 12345,
      });
      expect(numberDto.prompt).toBe(12345);

      const booleanDto = plainToInstance(SendAgentMessageDto, {
        prompt: true,
      });
      expect(booleanDto.prompt).toBe(true);

      const nullDto = plainToInstance(SendAgentMessageDto, {
        prompt: null,
      });
      expect(nullDto.prompt).toBeNull();

      const undefinedDto = plainToInstance(SendAgentMessageDto, {});
      expect(undefinedDto.prompt).toBeUndefined();

      const objectDto = plainToInstance(SendAgentMessageDto, {
        prompt: { text: 'hello' },
      });
      expect(objectDto.prompt).toEqual({ text: 'hello' });
    });
  });

  describe('clientContext type and Swagger metadata', () => {
    it('should transform plain clientContext into AgentClientContextDto instance via @Type', () => {
      const plain = {
        prompt: 'Recommend a fresh fragrance for summer',
        threadId: '41940989-53e7-4f65-bb02-c94314c4897f',
        clientContext: {
          currentPath: '/products/perfume-a',
          cart: [
            {
              variantId: 'variant-123',
              quantity: 2,
              price: 250000,
              name: 'Thai Perfume 50ml',
            },
          ],
        },
      };

      const dto = plainToInstance(SendAgentMessageDto, plain);

      expect(dto).toBeInstanceOf(SendAgentMessageDto);
      expect(dto.clientContext).toBeInstanceOf(AgentClientContextDto);
      expect(dto.clientContext?.currentPath).toBe('/products/perfume-a');
      expect(dto.clientContext?.cart?.[0].variantId).toBe('variant-123');
      expect(dto.clientContext?.cart?.[0].quantity).toBe(2);
    });

    it('should leave clientContext undefined when omitted', () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
      });

      expect(dto.clientContext).toBeUndefined();
    });

    it('should execute Swagger @ApiPropertyOptional lazy type function', () => {
      const metadata = Reflect.getMetadata(
        'swagger/apiModelProperties',
        SendAgentMessageDto.prototype,
        'clientContext',
      );

      expect(metadata).toBeDefined();
      expect(typeof metadata.type).toBe('function');

      const resolvedType = metadata.type();
      expect(resolvedType).toBe(AgentClientContextDto);
    });
  });

  describe('validation', () => {
    it('should pass validation with valid required and optional fields', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Recommend a fresh fragrance for summer',
        threadId: '41940989-53e7-4f65-bb02-c94314c4897f',
        clientContext: {
          currentPath: '/products/perfume-a',
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional threadId and clientContext', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Recommend a perfume',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when prompt is empty or only whitespace', async () => {
      const dtoEmpty = plainToInstance(SendAgentMessageDto, {
        prompt: '',
      });
      const errorsEmpty = await validate(dtoEmpty);
      expect(errorsEmpty.some((e) => e.property === 'prompt')).toBe(true);

      const dtoWhitespace = plainToInstance(SendAgentMessageDto, {
        prompt: '    ',
      });
      const errorsWhitespace = await validate(dtoWhitespace);
      expect(errorsWhitespace.some((e) => e.property === 'prompt')).toBe(true);
    });

    it('should fail validation when prompt is not a string', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 12345 as any,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'prompt')).toBe(true);
    });

    it('should fail validation when prompt exceeds 4000 characters', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'a'.repeat(4001),
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'prompt')).toBe(true);
    });

    it('should pass validation when prompt is exactly 4000 characters', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'a'.repeat(4000),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when threadId is not a valid UUID v4', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
        threadId: 'invalid-thread-id',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'threadId')).toBe(true);
    });

    it('should fail validation when nested clientContext is invalid', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
        clientContext: {
          currentPath: 'path-without-leading-slash',
        },
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'clientContext')).toBe(true);
    });
  });
});
