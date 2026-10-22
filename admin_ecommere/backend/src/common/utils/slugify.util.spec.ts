import { SlugifyUtil } from './slugify.util';

describe('SlugifyUtil', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined and instantiable', () => {
    expect(SlugifyUtil).toBeDefined();
    const instance = new SlugifyUtil();
    expect(instance).toBeInstanceOf(SlugifyUtil);
  });

  describe('generate', () => {
    it('should convert standard text to lowercase slug with hyphens', () => {
      const result = SlugifyUtil.generate('Hello World');
      expect(result).toBe('hello-world');
    });

    it('should convert uppercase text to lowercase', () => {
      const result = SlugifyUtil.generate('LAPTOP DELL XPS 15');
      expect(result).toBe('laptop-dell-xps-15');
    });

    it('should handle Vietnamese characters properly with locale vi', () => {
      const result = SlugifyUtil.generate('Áo Thun Nam Đẹp Đi Chơi');
      expect(result).toBe('ao-thun-nam-dep-di-choi');
    });

    it('should remove specified special characters based on remove regex', () => {
      // remove: /[*+~.()'"!:@]/g
      const result = SlugifyUtil.generate(
        'item*plus+tilde~dot.parens(open)close\'quote"bang!colon:at@test',
      );
      expect(result).toBe(
        'itemplustildedotparensopenclosequotebangcolonattest',
      );
    });

    it('should strip special characters in strict mode', () => {
      // strict: true removes unmapped special symbols like #, ?, /, etc.
      // Note: < and > are converted to 'less' and 'greater' by slugify charMap
      const result = SlugifyUtil.generate(
        'Product #1? (Special / Edition) <2024>',
      );
      expect(result).toBe('product-1-special-edition-less2024greater');
    });

    it('should trim leading and trailing spaces and collapse multiple spaces', () => {
      const result = SlugifyUtil.generate('   Sản phẩm     khuyến mãi   ');
      expect(result).toBe('san-pham-khuyen-mai');
    });

    it('should return an empty string when given an empty string', () => {
      const result = SlugifyUtil.generate('');
      expect(result).toBe('');
    });

    it('should throw an error when passed invalid non-string argument', () => {
      expect(() => SlugifyUtil.generate(null as unknown as string)).toThrow(
        Error,
      );
      expect(() => SlugifyUtil.generate(null as unknown as string)).toThrow(
        'slugify: string argument expected',
      );
      expect(() =>
        SlugifyUtil.generate(undefined as unknown as string),
      ).toThrow('slugify: string argument expected');
    });
  });

  describe('generateUnique', () => {
    it('should append custom suffix when suffix is provided', () => {
      const generateSpy = jest.spyOn(SlugifyUtil, 'generate');
      const result = SlugifyUtil.generateUnique('Áo Sơ Mi Nam', 'variant-1');

      expect(generateSpy).toHaveBeenCalledWith('Áo Sơ Mi Nam');
      expect(result).toBe('ao-so-mi-nam-variant-1');
    });

    it('should append Date.now() when suffix is omitted (undefined)', () => {
      const mockTimestamp = 1714567890123;
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
      const generateSpy = jest.spyOn(SlugifyUtil, 'generate');

      const result = SlugifyUtil.generateUnique('Giày Thể Thao');

      expect(generateSpy).toHaveBeenCalledWith('Giày Thể Thao');
      expect(dateSpy).toHaveBeenCalled();
      expect(result).toBe(`giay-the-thao-${mockTimestamp}`);
    });

    it('should append Date.now() when suffix is an empty string', () => {
      const mockTimestamp = 1714567899999;
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
      const generateSpy = jest.spyOn(SlugifyUtil, 'generate');

      const result = SlugifyUtil.generateUnique('Túi Xách Nữ', '');

      expect(generateSpy).toHaveBeenCalledWith('Túi Xách Nữ');
      expect(dateSpy).toHaveBeenCalled();
      expect(result).toBe(`tui-xach-nu-${mockTimestamp}`);
    });

    it('should propagate error if generate fails', () => {
      expect(() =>
        SlugifyUtil.generateUnique(null as unknown as string, 'sfx'),
      ).toThrow('slugify: string argument expected');
    });
  });
});
