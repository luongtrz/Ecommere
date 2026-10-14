import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class AgentCartItemDto {
  @ApiProperty({
    description: 'Product variant identifier',
    maxLength: 64,
    example: 'variant-123',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  variantId: string;

  @ApiProperty({
    description: 'Item quantity',
    minimum: 1,
    maximum: 99,
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Client-side item price hint in VND',
    minimum: 0,
    example: 250000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Product or variant name hint',
    maxLength: 200,
    example: 'Thai Perfume 50ml',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}

export class AgentClientContextDto {
  @ApiPropertyOptional({
    type: [AgentCartItemDto],
    description: 'Browser local cart items used as hints',
    maxItems: 100,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AgentCartItemDto)
  cart?: AgentCartItemDto[];

  @ApiPropertyOptional({
    description: 'Current browser URL path',
    maxLength: 200,
    example: '/products/perfume-a',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^\//)
  currentPath?: string;
}
