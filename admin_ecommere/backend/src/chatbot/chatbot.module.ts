import { Module } from '@nestjs/common';
import { AdminChatbotController } from './chatbot.controller';
import { adminAgentProviders } from './agent/admin.providers';
import { AdminModule } from '../admin/admin.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { CouponsModule } from '../coupons/coupons.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { InventoryModule } from '../inventory/inventory.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    AdminModule,
    OrdersModule,
    ProductsModule,
    CategoriesModule,
    CouponsModule,
    ReferralsModule,
    ReviewsModule,
    InventoryModule,
    UploadsModule,
  ],
  controllers: [AdminChatbotController],
  providers: [...adminAgentProviders],
})
export class ChatbotModule {}
