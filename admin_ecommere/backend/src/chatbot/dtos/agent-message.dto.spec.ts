import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SendAgentMessageDto } from './agent-message.dto';
import { AgentClientContextDto } from './agent-client-context.dto';

describe('SendAgentMessageDto', () => {
  it('instantiates the DTO directly and retains assigned values', () => {
    const dto = new SendAgentMessageDto();
    dto.prompt = 'Recommend a nice summer perfume';
    dto.threadId = '41940989-53e7-4f65-bb02-c94314c4897f';

    expect(dto).toBeInstanceOf(SendAgentMessageDto);
    expect(dto.prompt).toBe('Recommend a nice summer perfume');
    expect(dto.threadId).toBe('41940989-53e7-4f65-bb02-c94314c4897f');
    expect(dto.clientContext).toBeUndefined();
  });

  describe('prompt validation', () => {
    it('passes validation when prompt is valid string', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'How much is shipping to Hanoi?',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.prompt).toBe('How much is shipping to Hanoi?');
    });

    it('trims leading and trailing whitespace on string prompt via @Transform', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: '   \n  Recommend woody scents   \t  ',
      });

      expect(dto.prompt).toBe('Recommend woody scents');

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('leaves non-string number untouched in @Transform (false branch) and fails validation', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 123456,
      });

      expect(dto.prompt).toBe(123456 as any);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const promptError = errors.find((err) => err.property === 'prompt');
      expect(promptError).toBeDefined();
      expect(promptError?.constraints).toHaveProperty('isString');
    });

    it('leaves non-string boolean untouched in @Transform (false branch) and fails validation', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: true,
      });

      expect(dto.prompt).toBe(true as any);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const promptError = errors.find((err) => err.property === 'prompt');
      expect(promptError).toBeDefined();
      expect(promptError?.constraints).toHaveProperty('isString');
    });

    it('leaves non-string object untouched in @Transform (false branch) and fails validation', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: { message: 'hello' },
      });

      expect(dto.prompt).toEqual({ message: 'hello' } as any);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const promptError = errors.find((err) => err.property === 'prompt');
      expect(promptError).toBeDefined();
      expect(promptError?.constraints).toHaveProperty('isString');
    });

    it('leaves null untouched in @Transform (false branch) and fails validation', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: null,
      });

      expect(dto.prompt).toBeNull();

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const promptError = errors.find((err) => err.property === 'prompt');
      expect(promptError).toBeDefined();
      expect(promptError?.constraints).toHaveProperty('isString');
    });

    it('fails validation when prompt is omitted/undefined', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const promptError = errors.find((err) => err.property === 'prompt');
      expect(promptError).toBeDefined();
      expect(promptError?.constraints).toHaveProperty('isNotEmpty');
      expect(promptError?.constraints).toHaveProperty('isString');
    });

    it('fails validation when prompt is empty string', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const promptError = errors.find((err) => err.property === 'prompt');
      expect(promptError).toBeDefined();
      expect(promptError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('fails validation when prompt is only whitespace', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: '     \t  \n   ',
      });

      expect(dto.prompt).toBe('');

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const promptError = errors.find((err) => err.property === 'prompt');
      expect(promptError).toBeDefined();
      expect(promptError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('passes validation when prompt length is exactly 4000 characters', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'a'.repeat(4000),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('fails validation when prompt length exceeds 4000 characters', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'a'.repeat(4001),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const promptError = errors.find((err) => err.property === 'prompt');
      expect(promptError).toBeDefined();
      expect(promptError?.constraints).toHaveProperty('maxLength');
    });
  });

  describe('threadId validation', () => {
    it('passes validation when threadId is omitted/undefined', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
        threadId: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.threadId).toBeUndefined();
    });

    it('passes validation when threadId is null', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
        threadId: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('passes validation when threadId is a valid UUID v4', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Continue previous conversation',
        threadId: '41940989-53e7-4f65-bb02-c94314c4897f',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.threadId).toBe('41940989-53e7-4f65-bb02-c94314c4897f');
    });

    it('fails validation when threadId is not a valid UUID format', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
        threadId: 'not-a-valid-uuid',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const threadError = errors.find((err) => err.property === 'threadId');
      expect(threadError).toBeDefined();
      expect(threadError?.constraints).toHaveProperty('isUuid');
    });

    it('fails validation when threadId is a UUID v1 instead of UUID v4', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
        threadId: 'e787d96a-aee0-11ee-8c90-0242ac120002', // version 1
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const threadError = errors.find((err) => err.property === 'threadId');
      expect(threadError).toBeDefined();
      expect(threadError?.constraints).toHaveProperty('isUuid');
    });

    it('fails validation when threadId is a number', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
        threadId: 123456 as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const threadError = errors.find((err) => err.property === 'threadId');
      expect(threadError).toBeDefined();
      expect(threadError?.constraints).toHaveProperty('isUuid');
    });
  });

  describe('clientContext validation', () => {
    it('passes validation when clientContext is omitted/undefined', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.clientContext).toBeUndefined();
    });

    it('passes validation when clientContext is null', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
        clientContext: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('passes validation with a valid clientContext and transforms into AgentClientContextDto', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Suggest matching accessories for my cart',
        clientContext: {
          currentPath: '/products/perfume-blue',
          cart: [
            {
              variantId: 'variant-1',
              quantity: 2,
              price: 350000,
              name: 'Blue Perfume 100ml',
            },
          ],
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.clientContext).toBeInstanceOf(AgentClientContextDto);
      expect(dto.clientContext?.currentPath).toBe('/products/perfume-blue');
      expect(dto.clientContext?.cart?.[0].variantId).toBe('variant-1');
      expect(dto.clientContext?.cart?.[0].quantity).toBe(2);
    });

    it('fails validation when nested clientContext has invalid currentPath format', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
        clientContext: {
          currentPath: 'invalid-path-without-leading-slash',
        },
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contextError = errors.find(
        (err) => err.property === 'clientContext',
      );
      expect(contextError).toBeDefined();
      expect(contextError?.children?.length).toBeGreaterThan(0);
      const currentPathError = contextError?.children?.find(
        (child) => child.property === 'currentPath',
      );
      expect(currentPathError).toBeDefined();
      expect(currentPathError?.constraints).toHaveProperty('matches');
    });

    it('fails validation when nested cart item in clientContext has invalid quantity', async () => {
      const dto = plainToInstance(SendAgentMessageDto, {
        prompt: 'Hello',
        clientContext: {
          cart: [
            {
              variantId: 'variant-1',
              quantity: 0, // minimum is 1
            },
          ],
        },
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const contextError = errors.find(
        (err) => err.property === 'clientContext',
      );
      expect(contextError).toBeDefined();
      expect(contextError?.children?.length).toBeGreaterThan(0);
    });
  });
});
