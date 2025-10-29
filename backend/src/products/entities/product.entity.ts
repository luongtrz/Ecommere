import { ApiProperty } from '@nestjs/swagger';

export class ProductVariantEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  scent: string;

  @ApiProperty()
  volumeMl: number;

  @ApiProperty()
  price: number;

  @ApiProperty({ required: false })
  salePrice?: number;

  @ApiProperty()
  stock: number;

  @ApiProperty({ required: false })
  barcode?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<ProductVariantEntity>) {
    Object.assign(this, partial);
  }
}

export class ProductEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  brand?: string;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [ProductVariantEntity], required: false })
  variants?: ProductVariantEntity[];

  @ApiProperty({ required: false })
  category?: any;

  @ApiProperty({ required: false })
  averageRating?: number;

  @ApiProperty({ required: false })
  reviewCount?: number;

  constructor(partial: Partial<ProductEntity>) {
    Object.assign(this, partial);
  }
}
