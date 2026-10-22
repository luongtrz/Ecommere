import { UserEntity } from './user.entity';

describe('UserEntity', () => {
  it('should be defined', () => {
    expect(UserEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance of UserEntity with all properties assigned', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');
      const userData: Partial<UserEntity> = {
        id: 'user-123',
        email: 'admin@example.com',
        role: 'ADMIN',
        name: 'Admin User',
        phone: '0987654321',
        createdAt,
        updatedAt,
      };

      const entity = new UserEntity(userData);

      expect(entity).toBeInstanceOf(UserEntity);
      expect(entity.id).toBe('user-123');
      expect(entity.email).toBe('admin@example.com');
      expect(entity.role).toBe('ADMIN');
      expect(entity.name).toBe('Admin User');
      expect(entity.phone).toBe('0987654321');
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity).toEqual(userData);
    });

    it('should create an instance with only required properties and omit optional fields', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');
      const partialData: Partial<UserEntity> = {
        id: 'user-req',
        email: 'user@example.com',
        role: 'CUSTOMER',
        createdAt,
        updatedAt,
      };

      const entity = new UserEntity(partialData);

      expect(entity).toBeInstanceOf(UserEntity);
      expect(entity.id).toBe('user-req');
      expect(entity.email).toBe('user@example.com');
      expect(entity.role).toBe('CUSTOMER');
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity.name).toBeUndefined();
      expect(entity.phone).toBeUndefined();
    });

    it('should create an empty entity when instantiated with an empty object', () => {
      const entity = new UserEntity({});

      expect(entity).toBeInstanceOf(UserEntity);
      expect(entity.id).toBeUndefined();
      expect(entity.email).toBeUndefined();
      expect(entity.role).toBeUndefined();
      expect(entity.name).toBeUndefined();
      expect(entity.phone).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
    });

    it('should assign partial fields accurately', () => {
      const partialData: Partial<UserEntity> = {
        email: 'custom@example.com',
        role: 'STAFF',
      };

      const entity = new UserEntity(partialData);

      expect(entity).toBeInstanceOf(UserEntity);
      expect(entity.email).toBe('custom@example.com');
      expect(entity.role).toBe('STAFF');
      expect(entity.id).toBeUndefined();
      expect(entity.name).toBeUndefined();
      expect(entity.phone).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
    });

    it('should support different role string values', () => {
      const roles = ['ADMIN', 'STAFF', 'CUSTOMER', 'SUPERADMIN'];

      for (const role of roles) {
        const entity = new UserEntity({ role });
        expect(entity.role).toBe(role);
      }
    });

    it('should handle null or undefined partial gracefully without throwing', () => {
      const entityNull = new UserEntity(null as unknown as Partial<UserEntity>);
      expect(entityNull).toBeInstanceOf(UserEntity);

      const entityUndefined = new UserEntity(
        undefined as unknown as Partial<UserEntity>,
      );
      expect(entityUndefined).toBeInstanceOf(UserEntity);
    });
  });
});
