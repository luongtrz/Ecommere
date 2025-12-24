import { ApiProperty } from '@nestjs/swagger';

export class CartItemEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cartId: string;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  variant?: any;

  constructor(partial: Partial<CartItemEntity>) {
    Object.assign(this, partial);
  }
}

export class CartEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false })
  couponCode?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [CartItemEntity] })
  items: CartItemEntity[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  discount: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  coupon?: any;

  constructor(partial: Partial<CartEntity>) {
    Object.assign(this, partial);
  }
}
