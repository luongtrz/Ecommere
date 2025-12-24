import { ApiProperty } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';

export class StockMovementEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  variantId: string;

  @ApiProperty({ enum: StockMovementType })
  type: StockMovementType;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  previousStock: number;

  @ApiProperty()
  newStock: number;

  @ApiProperty({ required: false })
  orderId?: string;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  constructor(partial: Partial<StockMovementEntity>) {
    Object.assign(this, partial);
  }
}
