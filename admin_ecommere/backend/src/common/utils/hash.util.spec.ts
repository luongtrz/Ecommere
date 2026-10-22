import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { HashUtil } from './hash.util';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('HashUtil', () => {
  let util: HashUtil;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [HashUtil],
    }).compile();

    util = module.get<HashUtil>(HashUtil);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined and instantiable', () => {
    expect(util).toBeDefined();
    expect(util).toBeInstanceOf(HashUtil);
    expect(new HashUtil()).toBeInstanceOf(HashUtil);
  });

  describe('hash', () => {
    it('should hash a password using bcrypt with 10 salt rounds', async () => {
      const password = 'mySecretPassword123';
      const expectedHash = '$2b$10$abcdefghijklmnopqrstuvwxyz123456';
      (bcrypt.hash as jest.Mock).mockResolvedValue(expectedHash);

      const result = await HashUtil.hash(password);

      expect(result).toBe(expectedHash);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    });

    it('should reject when bcrypt.hash encounters an error', async () => {
      const password = 'errorPassword';
      const hashError = new Error('Bcrypt hashing failure');
      (bcrypt.hash as jest.Mock).mockRejectedValue(hashError);

      await expect(HashUtil.hash(password)).rejects.toThrow(hashError);
      await expect(HashUtil.hash(password)).rejects.toThrow(
        'Bcrypt hashing failure',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });
  });

  describe('compare', () => {
    it('should return true when password matches hash', async () => {
      const password = 'correctPassword';
      const hash = '$2b$10$validhashvalue1234567890';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await HashUtil.compare(password, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should return false when password does not match hash', async () => {
      const password = 'wrongPassword';
      const hash = '$2b$10$validhashvalue1234567890';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await HashUtil.compare(password, hash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should reject when bcrypt.compare encounters an error', async () => {
      const password = 'somePassword';
      const hash = 'invalid-hash-format';
      const compareError = new Error('data and hash arguments required');
      (bcrypt.compare as jest.Mock).mockRejectedValue(compareError);

      await expect(HashUtil.compare(password, hash)).rejects.toThrow(
        compareError,
      );
      await expect(HashUtil.compare(password, hash)).rejects.toThrow(
        'data and hash arguments required',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });
  });
});
