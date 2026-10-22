import { Test, TestingModule } from '@nestjs/testing';
import {
  CallHandler,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { of, throwError, lastValueFrom } from 'rxjs';
import { TransformInterceptor, Response } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  const mockResponse = {
    statusCode: 200,
  };

  const mockHttpArgumentsHost = {
    getRequest: jest.fn(),
    getResponse: jest.fn().mockReturnValue(mockResponse),
    getNext: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext;

  const mockCallHandler: CallHandler = {
    handle: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockResponse.statusCode = 200;
    mockHttpArgumentsHost.getResponse.mockReturnValue(mockResponse);
    mockExecutionContext.switchToHttp = jest
      .fn()
      .mockReturnValue(mockHttpArgumentsHost);

    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformInterceptor],
    }).compile();

    interceptor = module.get<TransformInterceptor<any>>(TransformInterceptor);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Response interface', () => {
    it('should correctly define the Response<T> shape', () => {
      const mockResponsePayload: Response<{ id: string; name: string }> = {
        data: { id: 'test-id', name: 'Sample Item' },
        statusCode: 200,
        timestamp: '2026-01-01T00:00:00.000Z',
      };

      expect(mockResponsePayload.data).toEqual({
        id: 'test-id',
        name: 'Sample Item',
      });
      expect(mockResponsePayload.statusCode).toBe(200);
      expect(mockResponsePayload.timestamp).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should transform object data into standard Response envelope with status code and ISO timestamp', async () => {
      const fixedIsoDate = '2026-03-30T10:00:00.000Z';
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(fixedIsoDate);

      const rawData = { id: 'admin-1', username: 'admin' };
      mockResponse.statusCode = 200;
      mockCallHandler.handle = jest.fn().mockReturnValue(of(rawData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result = await lastValueFrom(result$);

      expect(result).toEqual({
        data: rawData,
        statusCode: 200,
        timestamp: fixedIsoDate,
      });
      expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
      expect(mockHttpArgumentsHost.getResponse).toHaveBeenCalledTimes(1);
      expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('should transform array data correctly', async () => {
      const listData = [
        { id: '1', title: 'Product A' },
        { id: '2', title: 'Product B' },
      ];
      mockResponse.statusCode = 200;
      mockCallHandler.handle = jest.fn().mockReturnValue(of(listData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result = await lastValueFrom(result$);

      expect(result).toEqual({
        data: listData,
        statusCode: 200,
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
      });
      expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('should transform primitive string payload with 201 status code', async () => {
      const stringData = 'Resource successfully created';
      mockResponse.statusCode = 201;
      mockCallHandler.handle = jest.fn().mockReturnValue(of(stringData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result = await lastValueFrom(result$);

      expect(result).toEqual({
        data: stringData,
        statusCode: 201,
        timestamp: expect.any(String),
      });
    });

    it('should transform null response data with 204 status code', async () => {
      mockResponse.statusCode = 204;
      mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result = await lastValueFrom(result$);

      expect(result).toEqual({
        data: null,
        statusCode: 204,
        timestamp: expect.any(String),
      });
    });

    it('should transform boolean response data with 200 status code', async () => {
      mockResponse.statusCode = 200;
      mockCallHandler.handle = jest.fn().mockReturnValue(of(true));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result = await lastValueFrom(result$);

      expect(result).toEqual({
        data: true,
        statusCode: 200,
        timestamp: expect.any(String),
      });
    });

    it('should propagate BadRequestException when next.handle() throws validation error', async () => {
      const badRequestException = new BadRequestException(
        'Validation failed: email must be an email',
      );
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => badRequestException));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      await expect(lastValueFrom(result$)).rejects.toThrow(BadRequestException);
      await expect(
        lastValueFrom(
          interceptor.intercept(mockExecutionContext, mockCallHandler),
        ),
      ).rejects.toThrow('Validation failed: email must be an email');
    });

    it('should propagate NotFoundException when next.handle() throws not found', async () => {
      const notFoundException = new NotFoundException('Entity not found');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => notFoundException));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      await expect(lastValueFrom(result$)).rejects.toThrow(NotFoundException);
      await expect(
        lastValueFrom(
          interceptor.intercept(mockExecutionContext, mockCallHandler),
        ),
      ).rejects.toThrow('Entity not found');
    });

    it('should propagate InternalServerErrorException when dependency fails', async () => {
      const internalServerException = new InternalServerErrorException(
        'Database connection lost',
      );
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => internalServerException));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      await expect(lastValueFrom(result$)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(
        lastValueFrom(
          interceptor.intercept(mockExecutionContext, mockCallHandler),
        ),
      ).rejects.toThrow('Database connection lost');
    });

    it('should propagate generic Error when handler throws unexpected error', async () => {
      const genericError = new Error('Unexpected system error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => genericError));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      await expect(lastValueFrom(result$)).rejects.toThrow(genericError);
      await expect(
        lastValueFrom(
          interceptor.intercept(mockExecutionContext, mockCallHandler),
        ),
      ).rejects.toThrow('Unexpected system error');
    });
  });
});
