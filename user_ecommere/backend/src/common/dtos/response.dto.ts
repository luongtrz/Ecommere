import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto<T = any> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message?: string;

  @ApiProperty()
  data?: T;

  constructor(data?: T, message?: string) {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

export class ErrorResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  error: string;

  @ApiProperty()
  message: string | string[];

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  timestamp: string;

  constructor(error: string, message: string | string[], statusCode: number) {
    this.success = false;
    this.error = error;
    this.message = message;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}
