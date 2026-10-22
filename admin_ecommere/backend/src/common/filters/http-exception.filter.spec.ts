import { Test, TestingModule } from '@nestjs/testing';
import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let loggerErrorSpy: jest.SpyInstance;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const mockRequest = {
    url: '/api/v1/test',
    method: 'GET',
  };

  const mockArgumentsHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ArgumentsHost;

  const fixedDate = new Date('2026-03-01T12:00:00.000Z');

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);

    jest.clearAllMocks();

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should instantiate directly via constructor', () => {
    const directInstance = new HttpExceptionFilter();
    expect(directInstance).toBeDefined();
    expect(directInstance).toBeInstanceOf(HttpExceptionFilter);
  });

  describe('when exception is an HttpException', () => {
    it('should handle HttpException with object response having message and error', () => {
      const exception = new HttpException(
        {
          message: 'Resource not found',
          error: 'Not Found',
        },
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.NOT_FOUND,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Not Found',
        message: 'Resource not found',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        exception.stack,
      );
    });

    it('should handle HttpException with array of validation messages', () => {
      const messages = ['email must be an email', 'password is too short'];
      const exception = new BadRequestException({
        message: messages,
        error: 'Bad Request',
      });

      filter.catch(exception, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Bad Request',
        message: messages,
      };

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        exception.stack,
      );
    });

    it('should fallback to defaults when object response lacks message and error properties', () => {
      const exception = new HttpException({}, HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.FORBIDDEN,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Internal Server Error',
        message: 'Internal server error',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        exception.stack,
      );
    });

    it('should use custom message and fallback to default error when error is missing in object response', () => {
      const exception = new HttpException(
        { message: 'Conflict detected' },
        HttpStatus.CONFLICT,
      );

      filter.catch(exception, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.CONFLICT,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Internal Server Error',
        message: 'Conflict detected',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        exception.stack,
      );
    });

    it('should use custom error and fallback to default message when message is missing in object response', () => {
      const exception = new HttpException(
        { error: 'Payment Required' },
        HttpStatus.PAYMENT_REQUIRED,
      );

      filter.catch(exception, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Payment Required',
        message: 'Internal server error',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.PAYMENT_REQUIRED,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        exception.stack,
      );
    });

    it('should handle HttpException with string (primitive) response', () => {
      const stringException = new HttpException(
        'Unauthorized access token',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(stringException, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.UNAUTHORIZED,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Internal Server Error',
        message: 'Unauthorized access token',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        stringException.stack,
      );
    });

    it('should handle standard NestJS NotFoundException', () => {
      const exception = new NotFoundException('Cannot find product with ID 99');

      filter.catch(exception, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.NOT_FOUND,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Not Found',
        message: 'Cannot find product with ID 99',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        exception.stack,
      );
    });
  });

  describe('when exception is not an HttpException', () => {
    it('should handle generic Error instance with status 500 and log stack trace', () => {
      const exception = new Error('Unexpected database failure');

      filter.catch(exception, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Internal Server Error',
        message: 'Internal server error',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        exception.stack,
      );
    });

    it('should handle Error instance with undefined stack', () => {
      const exception = new Error('Error without stack');
      delete exception.stack;

      filter.catch(exception, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Internal Server Error',
        message: 'Internal server error',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        undefined,
      );
    });

    it('should handle non-Error string exception with status 500 and empty stack trace', () => {
      const exception = 'Fatal unhandled string error';

      filter.catch(exception, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Internal Server Error',
        message: 'Internal server error',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        '',
      );
    });

    it('should handle non-Error object exception with status 500 and empty stack trace', () => {
      const exception = { code: 500, detail: 'Unknown error object' };

      filter.catch(exception, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Internal Server Error',
        message: 'Internal server error',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        '',
      );
    });

    it('should handle null/undefined exception with status 500 and empty stack trace', () => {
      const exception = null;

      filter.catch(exception, mockArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/test',
        method: 'GET',
        error: 'Internal Server Error',
        message: 'Internal server error',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GET /api/v1/test',
        JSON.stringify(expectedErrorResponse),
        '',
      );
    });
  });

  describe('request details in error response', () => {
    it('should record method and url from the request object', () => {
      const customRequest = {
        url: '/api/v1/orders/create',
        method: 'POST',
      };

      const customArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(customRequest),
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException(
        'Action prohibited',
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, customArgumentsHost);

      const expectedErrorResponse = {
        statusCode: HttpStatus.FORBIDDEN,
        timestamp: fixedDate.toISOString(),
        path: '/api/v1/orders/create',
        method: 'POST',
        error: 'Internal Server Error',
        message: 'Action prohibited',
      };

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'POST /api/v1/orders/create',
        JSON.stringify(expectedErrorResponse),
        exception.stack,
      );
    });
  });
});
