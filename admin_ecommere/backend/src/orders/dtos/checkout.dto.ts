import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsObject, IsNumber } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({ example: 'address-id', required: false })
  @IsOptional()
  @IsString()
  addressId?: string;

  // Address fields for creating new address during checkout
  @ApiProperty({ example: 'Nguyễn Văn A', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: '0912345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Hồ Chí Minh', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ example: 'Quận 1', required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'Phường Bến Nghé', required: false })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiProperty({ example: '123 Đường Lê Lợi', required: false })
  @IsOptional()
  @IsString()
  line1?: string;

  // Additional fields from frontend payload
  @ApiProperty({ example: [{ variantId: 'variant-id', quantity: 1, price: 100000 }], required: false })
  @IsOptional()
  @IsArray()
  items?: { variantId: string; quantity: number; price: number }[];

  @ApiProperty({ example: 'COD', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ example: { fullName: 'Nguyễn Văn A', phone: '0912345678', address: '123 Đường ABC', ward: 'Phường X', district: 'Quận Y', province: 'TP.HCM' }, required: false })
  @IsOptional()
  @IsObject()
  shippingAddress?: { fullName: string; phone: string; address: string; ward: string; district: string; province: string };

  @ApiProperty({ example: 'STANDARD', required: false })
  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @ApiProperty({ example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  shippingFee?: number;

  @ApiProperty({ example: 305000, required: false })
  @IsOptional()
  @IsNumber()
  total?: number;
}
