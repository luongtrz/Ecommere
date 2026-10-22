import { Test, TestingModule } from '@nestjs/testing';
import {
  CallHandler,
  ExecutionContext,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { of, throwError, lastValueFrom } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  const mockRequest = {
    method: 'GET',
    url: '/api/v1/orders',
  };

  const mockResponse = {
    statusCode: 200,
  };

  const mockHttpArgumentsHost = {
    getRequest: jest.fn().mockReturnValue(mockRequest),
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

    mockRequest.method = 'GET';
    mockRequest.url = '/api/v1/orders';
    mockResponse.statusCode = 200;

    mockHttpArgumentsHost.getRequest.mockReturnValue(mockRequest);
    mockHttpArgumentsHost.getResponse.mockReturnValue(mockResponse);
    mockExecutionContext.switchToHttp = jest
      .fn()
      .mockReturnValue(mockHttpArgumentsHost);

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should log request method, url, status code, and execution time on success', async () => {
      const loggerSpy = jest
        .spyOn((interceptor as any).logger, 'log')
        .mockImplementation();

      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1050);

      const mockResponseData = { success: true, data: [{ id: 'order-1' }] };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(mockResponseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result = await lastValueFrom(result$);

      expect(result).toEqual(mockResponseData);
      expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
      expect(mockHttpArgumentsHost.getRequest).toHaveBeenCalledTimes(1);
      expect(mockHttpArgumentsHost.getResponse).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith('GET /api/v1/orders 200 - 50ms');
    });

    it('should log POST request with 201 status code and accurate delay', async () => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/v1/products';
      mockResponse.statusCode = 201;

      const loggerSpy = jest
        .spyOn((interceptor as any).logger, 'log')
        .mockImplementation();

      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(2135);

      const createdProduct = { id: 'prod-123', name: 'Spray Gun' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(createdProduct));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result = await lastValueFrom(result$);

      expect(result).toEqual(createdProduct);
      expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
      expect(mockHttpArgumentsHost.getRequest).toHaveBeenCalledTimes(1);
      expect(mockHttpArgumentsHost.getResponse).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        'POST /api/v1/products 201 - 135ms',
      );
    });

    it('should log request with 404 status code when response status indicates not found', async () => {
      mockRequest.method = 'GET';
      mockRequest.url = '/api/v1/orders/non-existent';
      mockResponse.statusCode = 404;

      const loggerSpy = jest
        .spyOn((interceptor as any).logger, 'log')
        .mockImplementation();

      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(3000)
        .mockReturnValueOnce(3015);

      const notFoundBody = { message: 'Order not found' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(notFoundBody));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result = await lastValueFrom(result$);

      expect(result).toEqual(notFoundBody);
      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        'GET /api/v1/orders/non-existent 404 - 15ms',
      );
    });

    it('should propagate HttpException without calling logger when next.handle() throws NotFoundException', async () => {
      const loggerSpy = jest
        .spyOn((interceptor as any).logger, 'log')
        .mockImplementation();

      const notFoundException = new NotFoundException('Resource not found');
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
      ).rejects.toThrow('Resource not found');
      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(loggerSpy).not.toHaveBeenCalled();
    });

    it('should propagate InternalServerErrorException without calling logger when dependency fails', async () => {
      const loggerSpy = jest
        .spyOn((interceptor as any).logger, 'log')
        .mockImplementation();

      const serverException = new InternalServerErrorException(
        'Database connection timeout',
      );
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => serverException));

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
      ).rejects.toThrow('Database connection timeout');
      expect(loggerSpy).not.toHaveBeenCalled();
    });

    it('should propagate standard Error without calling logger when unexpected exception occurs', async () => {
      const loggerSpy = jest
        .spyOn((interceptor as any).logger, 'log')
        .mockImplementation();

      const genericError = new Error('Unexpected runtime failure');
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
      ).rejects.toThrow('Unexpected runtime failure');
      expect(loggerSpy).not.toHaveBeenCalled();
    });
  });
});
