import { ApiProperty } from '@nestjs/swagger';

export class ReviewEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  rating: number;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  user?: any;

  @ApiProperty({ required: false })
  product?: any;

  constructor(partial: Partial<ReviewEntity>) {
    Object.assign(this, partial);
  }
}
