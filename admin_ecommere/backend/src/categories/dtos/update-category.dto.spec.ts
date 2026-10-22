import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateCategoryDto } from './update-category.dto';

describe('UpdateCategoryDto', () => {
  it('should instantiate the DTO directly', () => {
    const dto = new UpdateCategoryDto();
    dto.name = 'Updated Category';
    dto.parentId = 'parent-123';

    expect(dto).toBeInstanceOf(UpdateCategoryDto);
    expect(dto.name).toBe('Updated Category');
    expect(dto.parentId).toBe('parent-123');
  });

  describe('validation', () => {
    it('should pass validation when all fields are empty/omitted', async () => {
      const dto = plainToInstance(UpdateCategoryDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid name only', async () => {
      const dto = plainToInstance(UpdateCategoryDto, {
        name: 'New Name',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('New Name');
    });

    it('should trim string name via @Transform and pass validation', async () => {
      const dto = plainToInstance(UpdateCategoryDto, {
        name: '   New Name   ',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('New Name');
    });

    it('should leave non-string value untouched in @Transform and fail validation', async () => {
      const dto = plainToInstance(UpdateCategoryDto, {
        name: 12345,
      });

      expect(dto.name).toBe(12345);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((err) => err.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when name is empty string', async () => {
      const dto = plainToInstance(UpdateCategoryDto, {
        name: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((err) => err.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when name is only whitespace', async () => {
      const dto = plainToInstance(UpdateCategoryDto, {
        name: '     ',
      });

      expect(dto.name).toBe('');

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((err) => err.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass validation with valid parentId only', async () => {
      const dto = plainToInstance(UpdateCategoryDto, {
        parentId: 'parent-456',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.parentId).toBe('parent-456');
    });

    it('should pass validation with both name and parentId', async () => {
      const dto = plainToInstance(UpdateCategoryDto, {
        name: 'Updated Category',
        parentId: 'parent-456',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('Updated Category');
      expect(dto.parentId).toBe('parent-456');
    });

    it('should pass validation when parentId is undefined or null', async () => {
      const dtoUndefined = plainToInstance(UpdateCategoryDto, {
        parentId: undefined,
      });
      const errorsUndefined = await validate(dtoUndefined);
      expect(errorsUndefined).toHaveLength(0);

      const dtoNull = plainToInstance(UpdateCategoryDto, {
        parentId: null,
      });
      const errorsNull = await validate(dtoNull);
      expect(errorsNull).toHaveLength(0);
    });

    it('should fail validation when parentId is not a string (number)', async () => {
      const dto = plainToInstance(UpdateCategoryDto, {
        parentId: 9999,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const parentIdError = errors.find((err) => err.property === 'parentId');
      expect(parentIdError).toBeDefined();
      expect(parentIdError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when parentId is not a string (boolean)', async () => {
      const dto = plainToInstance(UpdateCategoryDto, {
        parentId: false,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const parentIdError = errors.find((err) => err.property === 'parentId');
      expect(parentIdError).toBeDefined();
      expect(parentIdError?.constraints).toHaveProperty('isString');
    });
  });
});
