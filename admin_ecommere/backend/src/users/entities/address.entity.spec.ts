import { AddressEntity } from './address.entity';

describe('AddressEntity', () => {
  it('should be defined', () => {
    expect(AddressEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance of AddressEntity with all properties assigned', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const addressData: Partial<AddressEntity> = {
        id: 'addr-1',
        userId: 'user-123',
        fullName: 'John Doe',
        phone: '0987654321',
        province: 'Hanoi',
        district: 'Ba Dinh',
        ward: 'Cong Vi',
        line1: '123 Lieu Giai',
        isDefault: true,
        createdAt,
      };

      const entity = new AddressEntity(addressData);

      expect(entity).toBeInstanceOf(AddressEntity);
      expect(entity.id).toBe('addr-1');
      expect(entity.userId).toBe('user-123');
      expect(entity.fullName).toBe('John Doe');
      expect(entity.phone).toBe('0987654321');
      expect(entity.province).toBe('Hanoi');
      expect(entity.district).toBe('Ba Dinh');
      expect(entity.ward).toBe('Cong Vi');
      expect(entity.line1).toBe('123 Lieu Giai');
      expect(entity.isDefault).toBe(true);
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity).toEqual(addressData);
    });

    it('should create an instance with isDefault set to false', () => {
      const entity = new AddressEntity({
        id: 'addr-2',
        isDefault: false,
      });

      expect(entity).toBeInstanceOf(AddressEntity);
      expect(entity.id).toBe('addr-2');
      expect(entity.isDefault).toBe(false);
    });

    it('should create an instance with only required properties and omit optional fields', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const partialData: Partial<AddressEntity> = {
        id: 'addr-min',
        userId: 'user-min',
        fullName: 'Jane Doe',
        phone: '0123456789',
        province: 'HCMC',
        district: 'District 1',
        ward: 'Ben Nghe',
        line1: '1 Nguyen Hue',
        isDefault: false,
        createdAt,
      };

      const entity = new AddressEntity(partialData);

      expect(entity).toBeInstanceOf(AddressEntity);
      expect(entity.id).toBe('addr-min');
      expect(entity.userId).toBe('user-min');
      expect(entity.fullName).toBe('Jane Doe');
      expect(entity.phone).toBe('0123456789');
      expect(entity.province).toBe('HCMC');
      expect(entity.district).toBe('District 1');
      expect(entity.ward).toBe('Ben Nghe');
      expect(entity.line1).toBe('1 Nguyen Hue');
      expect(entity.isDefault).toBe(false);
      expect(entity.createdAt).toEqual(createdAt);
    });

    it('should create an empty entity when instantiated with an empty object', () => {
      const entity = new AddressEntity({});

      expect(entity).toBeInstanceOf(AddressEntity);
      expect(entity.id).toBeUndefined();
      expect(entity.userId).toBeUndefined();
      expect(entity.fullName).toBeUndefined();
      expect(entity.phone).toBeUndefined();
      expect(entity.province).toBeUndefined();
      expect(entity.district).toBeUndefined();
      expect(entity.ward).toBeUndefined();
      expect(entity.line1).toBeUndefined();
      expect(entity.isDefault).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
    });

    it('should assign partial fields accurately', () => {
      const partialData: Partial<AddressEntity> = {
        fullName: 'Custom Name',
        phone: '0900000000',
      };

      const entity = new AddressEntity(partialData);

      expect(entity).toBeInstanceOf(AddressEntity);
      expect(entity.fullName).toBe('Custom Name');
      expect(entity.phone).toBe('0900000000');
      expect(entity.id).toBeUndefined();
      expect(entity.userId).toBeUndefined();
      expect(entity.province).toBeUndefined();
      expect(entity.district).toBeUndefined();
      expect(entity.ward).toBeUndefined();
      expect(entity.line1).toBeUndefined();
      expect(entity.isDefault).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
    });

    it('should handle null or undefined partial gracefully without throwing', () => {
      const entityNull = new AddressEntity(
        null as unknown as Partial<AddressEntity>,
      );
      expect(entityNull).toBeInstanceOf(AddressEntity);

      const entityUndefined = new AddressEntity(
        undefined as unknown as Partial<AddressEntity>,
      );
      expect(entityUndefined).toBeInstanceOf(AddressEntity);
    });
  });
});
