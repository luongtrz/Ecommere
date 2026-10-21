import { Reflector } from '@nestjs/core';
import { Public, IS_PUBLIC_KEY } from './public.decorator';

describe('Public Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('IS_PUBLIC_KEY', () => {
    it('should be defined as a string', () => {
      expect(IS_PUBLIC_KEY).toBeDefined();
      expect(typeof IS_PUBLIC_KEY).toBe('string');
    });

    it('should have the exact key value "isPublic"', () => {
      expect(IS_PUBLIC_KEY).toBe('isPublic');
    });
  });

  describe('Public()', () => {
    it('should be defined as a function', () => {
      expect(Public).toBeDefined();
      expect(typeof Public).toBe('function');
    });

    it('should return a custom decorator function', () => {
      const decorator = Public();
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    it('should set metadata isPublic = true when applied to a method', () => {
      class TestController {
        @Public()
        publicMethod() {
          return 'public';
        }

        securedMethod() {
          return 'secured';
        }
      }

      const instance = new TestController();

      const isPublic = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        instance.publicMethod,
      );
      expect(isPublic).toBe(true);

      const isSecuredPublic = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        instance.securedMethod,
      );
      expect(isSecuredPublic).toBeUndefined();

      expect(
        Reflect.getMetadata(
          IS_PUBLIC_KEY,
          TestController.prototype.publicMethod,
        ),
      ).toBe(true);
      expect(
        Reflect.getMetadata(
          IS_PUBLIC_KEY,
          TestController.prototype.securedMethod,
        ),
      ).toBeUndefined();
    });

    it('should set metadata isPublic = true when applied to a class', () => {
      @Public()
      class PublicController {}

      class SecuredController {}

      const isPublic = reflector.get<boolean>(IS_PUBLIC_KEY, PublicController);
      expect(isPublic).toBe(true);

      const isSecuredPublic = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        SecuredController,
      );
      expect(isSecuredPublic).toBeUndefined();

      expect(Reflect.getMetadata(IS_PUBLIC_KEY, PublicController)).toBe(true);
      expect(
        Reflect.getMetadata(IS_PUBLIC_KEY, SecuredController),
      ).toBeUndefined();
    });

    it('should set metadata correctly when invoked manually as a decorator function', () => {
      const decorator = Public();
      class ManualClass {}

      decorator(ManualClass);

      expect(Reflect.getMetadata(IS_PUBLIC_KEY, ManualClass)).toBe(true);
    });
  });
});
