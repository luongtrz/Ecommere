import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotRetrievalService } from './chatbot-retrieval.service';
import { agentProviders } from './agent/agent.providers';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { OrdersModule } from '../orders/orders.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [
    ProductsModule,
    CategoriesModule,
    UsersModule,
    ReferralsModule,
    OrdersModule,
    ReviewsModule,
    CouponsModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotRetrievalService, ...agentProviders],
})
export class ChatbotModule {}
