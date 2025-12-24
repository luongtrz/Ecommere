import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '0912345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Hồ Chí Minh' })
  @IsString()
  province: string;

  @ApiProperty({ example: 'Quận 1' })
  @IsString()
  district: string;

  @ApiProperty({ example: 'Phường Bến Nghé' })
  @IsString()
  ward: string;

  @ApiProperty({ example: '123 Đường Lê Lợi' })
  @IsString()
  line1: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
