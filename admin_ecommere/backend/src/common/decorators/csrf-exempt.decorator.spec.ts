import { Reflector } from '@nestjs/core';
import { CsrfExempt, IS_CSRF_EXEMPT_KEY } from './csrf-exempt.decorator';

describe('CsrfExempt Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('IS_CSRF_EXEMPT_KEY', () => {
    it('should be defined as a string', () => {
      expect(IS_CSRF_EXEMPT_KEY).toBeDefined();
      expect(typeof IS_CSRF_EXEMPT_KEY).toBe('string');
    });

    it('should have the exact key value "isCsrfExempt"', () => {
      expect(IS_CSRF_EXEMPT_KEY).toBe('isCsrfExempt');
    });
  });

  describe('CsrfExempt()', () => {
    it('should be defined as a function', () => {
      expect(CsrfExempt).toBeDefined();
      expect(typeof CsrfExempt).toBe('function');
    });

    it('should return a custom decorator function', () => {
      const decorator = CsrfExempt();
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    it('should set metadata isCsrfExempt = true when applied to a method', () => {
      class TestController {
        @CsrfExempt()
        exemptMethod() {
          return 'exempt';
        }

        normalMethod() {
          return 'normal';
        }
      }

      const instance = new TestController();

      const isExempt = reflector.get<boolean>(
        IS_CSRF_EXEMPT_KEY,
        instance.exemptMethod,
      );
      expect(isExempt).toBe(true);

      const isNormalExempt = reflector.get<boolean>(
        IS_CSRF_EXEMPT_KEY,
        instance.normalMethod,
      );
      expect(isNormalExempt).toBeUndefined();

      expect(
        Reflect.getMetadata(
          IS_CSRF_EXEMPT_KEY,
          TestController.prototype.exemptMethod,
        ),
      ).toBe(true);
      expect(
        Reflect.getMetadata(
          IS_CSRF_EXEMPT_KEY,
          TestController.prototype.normalMethod,
        ),
      ).toBeUndefined();
    });

    it('should set metadata isCsrfExempt = true when applied to a class', () => {
      @CsrfExempt()
      class ExemptController {}

      class NormalController {}

      const isExempt = reflector.get<boolean>(
        IS_CSRF_EXEMPT_KEY,
        ExemptController,
      );
      expect(isExempt).toBe(true);

      const isNormalExempt = reflector.get<boolean>(
        IS_CSRF_EXEMPT_KEY,
        NormalController,
      );
      expect(isNormalExempt).toBeUndefined();

      expect(Reflect.getMetadata(IS_CSRF_EXEMPT_KEY, ExemptController)).toBe(
        true,
      );
      expect(
        Reflect.getMetadata(IS_CSRF_EXEMPT_KEY, NormalController),
      ).toBeUndefined();
    });

    it('should set metadata correctly when invoked manually as a decorator function', () => {
      const decorator = CsrfExempt();
      class ManualClass {}

      decorator(ManualClass);

      expect(Reflect.getMetadata(IS_CSRF_EXEMPT_KEY, ManualClass)).toBe(true);
    });
  });
});
