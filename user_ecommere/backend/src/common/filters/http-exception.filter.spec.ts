import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockRequest: {
    url: string;
    method: string;
  };
  let mockArgumentsHost: ArgumentsHost;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/v1/test',
      method: 'GET',
    };

    const mockHttpArgumentsHost = {
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn().mockReturnValue(mockRequest),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
    } as unknown as ArgumentsHost;

    filter = new HttpExceptionFilter();
    loggerErrorSpy = jest
      .spyOn((filter as any).logger, 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException with object response having message and error', () => {
    mockRequest.method = 'POST';
    mockRequest.url = '/api/v1/items';

    const exceptionResponse = {
      message: 'Validation failed',
      error: 'Bad Request',
    };
    const exception = new HttpException(
      exceptionResponse,
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      path: '/api/v1/items',
      method: 'POST',
      error: 'Bad Request',
      message: 'Validation failed',
    });

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'POST /api/v1/items',
      expect.stringContaining('"statusCode":400'),
      exception.stack,
    );
    const loggedJson = JSON.parse(loggerErrorSpy.mock.calls[0][1]);
    expect(loggedJson).toEqual({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      path: '/api/v1/items',
      method: 'POST',
      error: 'Bad Request',
      message: 'Validation failed',
    });
  });

  it('should handle HttpException with object response missing message and error (falling back to defaults)', () => {
    const exception = new HttpException({}, HttpStatus.UNAUTHORIZED);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNAUTHORIZED,
      timestamp: expect.any(String),
      path: '/api/v1/test',
      method: 'GET',
      error: 'Internal Server Error',
      message: 'Internal server error',
    });

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'GET /api/v1/test',
      expect.stringContaining('"statusCode":401'),
      exception.stack,
    );
    const loggedJson = JSON.parse(loggerErrorSpy.mock.calls[0][1]);
    expect(loggedJson.error).toBe('Internal Server Error');
    expect(loggedJson.message).toBe('Internal server error');
  });

  it('should handle HttpException with object response having empty string message and error (falling back to defaults)', () => {
    const exception = new HttpException(
      { message: '', error: '' },
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: expect.any(String),
      path: '/api/v1/test',
      method: 'GET',
      error: 'Internal Server Error',
      message: 'Internal server error',
    });
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException(
      'Forbidden resource',
      HttpStatus.FORBIDDEN,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.FORBIDDEN,
      timestamp: expect.any(String),
      path: '/api/v1/test',
      method: 'GET',
      error: 'Internal Server Error',
      message: 'Forbidden resource',
    });

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'GET /api/v1/test',
      expect.stringContaining('"message":"Forbidden resource"'),
      exception.stack,
    );
  });

  it('should handle HttpException with array message in response object', () => {
    const messages = ['email must be valid', 'password is too short'];
    const exception = new HttpException(
      { message: messages, error: 'Unprocessable Entity' },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      timestamp: expect.any(String),
      path: '/api/v1/test',
      method: 'GET',
      error: 'Unprocessable Entity',
      message: messages,
    });
  });

  it('should handle generic Error instance (non-HttpException) and log stack', () => {
    const exception = new Error('Database connection failed');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
      path: '/api/v1/test',
      method: 'GET',
      error: 'Internal Server Error',
      message: 'Internal server error',
    });

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'GET /api/v1/test',
      expect.stringContaining('"statusCode":500'),
      exception.stack,
    );
  });

  it('should handle non-Error primitive string exception and log empty string for stack', () => {
    const exception = 'Unexpected failure string';

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
      path: '/api/v1/test',
      method: 'GET',
      error: 'Internal Server Error',
      message: 'Internal server error',
    });

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'GET /api/v1/test',
      expect.stringContaining('"statusCode":500'),
      '',
    );
  });

  it('should handle non-Error plain object exception and log empty string for stack', () => {
    const exception = { code: 500, detail: 'network timeout' };

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
      path: '/api/v1/test',
      method: 'GET',
      error: 'Internal Server Error',
      message: 'Internal server error',
    });

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'GET /api/v1/test',
      expect.stringContaining('"statusCode":500'),
      '',
    );
  });
});
