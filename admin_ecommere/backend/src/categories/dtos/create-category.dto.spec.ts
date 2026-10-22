import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';

describe('CreateCategoryDto', () => {
  it('should instantiate the DTO directly', () => {
    const dto = new CreateCategoryDto();
    dto.name = 'Electronics';
    dto.parentId = 'parent-123';

    expect(dto).toBeInstanceOf(CreateCategoryDto);
    expect(dto.name).toBe('Electronics');
    expect(dto.parentId).toBe('parent-123');
  });

  describe('validation', () => {
    it('should pass validation with valid data (name only)', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: 'Living Room',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('Living Room');
      expect(dto.parentId).toBeUndefined();
    });

    it('should pass validation with valid data (name and parentId)', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: 'Air Freshener',
        parentId: 'parent-category-id',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('Air Freshener');
      expect(dto.parentId).toBe('parent-category-id');
    });

    it('should trim string name via @Transform and pass validation', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: '   Air Freshener   ',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('Air Freshener');
    });

    it('should leave non-string value untouched in @Transform (false branch)', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: 12345,
      });

      expect(dto.name).toBe(12345);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((err) => err.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isString');
    });

    it('should leave non-string object untouched in @Transform (false branch)', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: { nested: true },
      });

      expect(dto.name).toEqual({ nested: true });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((err) => err.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when name is missing', async () => {
      const dto = plainToInstance(CreateCategoryDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((err) => err.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isString');
      expect(nameError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when name is empty string', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((err) => err.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when name is only whitespace', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: '     ',
      });

      expect(dto.name).toBe('');

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((err) => err.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass validation when parentId is undefined', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: 'Valid Name',
        parentId: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when parentId is null (optional)', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: 'Valid Name',
        parentId: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when parentId is not a string (number)', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: 'Valid Name',
        parentId: 9999,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const parentIdError = errors.find((err) => err.property === 'parentId');
      expect(parentIdError).toBeDefined();
      expect(parentIdError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when parentId is not a string (boolean)', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: 'Valid Name',
        parentId: true,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const parentIdError = errors.find((err) => err.property === 'parentId');
      expect(parentIdError).toBeDefined();
      expect(parentIdError?.constraints).toHaveProperty('isString');
    });
  });
});
