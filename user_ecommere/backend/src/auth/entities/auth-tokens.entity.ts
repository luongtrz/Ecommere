import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensEntity {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  expiresIn: string;

  constructor(accessToken: string, refreshToken: string, expiresIn: string = '15m') {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
  }
}
