import { ToolRegistry } from './tool.registry';
import { createCatalogTools } from './domains/catalog.tools';
import { createAccountTools } from './domains/account.tools';
import { createOrdersTools } from './domains/orders.tools';
import { createReviewsShippingTools } from './domains/reviews-shipping.tools';
import { createClientActionTools } from './domains/client-actions.tools';

import type { ProductsService } from '../../products/products.service';
import type { CategoriesService } from '../../categories/categories.service';
import type { ChatbotRetrievalService } from '../chatbot-retrieval.service';
import type { UsersService } from '../../users/users.service';
import type { ReferralsService } from '../../referrals/referrals.service';
import type { OrdersService } from '../../orders/orders.service';
import type { ReviewsService } from '../../reviews/reviews.service';
import type { CouponsService } from '../../coupons/coupons.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { CartService } from '../../cart/cart.service';

export interface UserRegistryDeps {
  products: ProductsService;
  categories: CategoriesService;
  retrieval: ChatbotRetrievalService;
  users: UsersService;
  referrals: ReferralsService;
  orders: OrdersService;
  reviews: ReviewsService;
  coupons: CouponsService;
  prisma: PrismaService;
  cart: CartService;
}

export function buildUserToolRegistry(deps: UserRegistryDeps): ToolRegistry {
  return new ToolRegistry([
    ...createCatalogTools({
      products: deps.products,
      categories: deps.categories,
      retrieval: deps.retrieval,
    }),
    ...createAccountTools({
      users: deps.users,
      referrals: deps.referrals,
    }),
    ...createOrdersTools({
      orders: deps.orders,
      cart: deps.cart,
    }),
    ...createReviewsShippingTools({
      reviews: deps.reviews,
      coupons: deps.coupons,
      orders: deps.orders,
    }),
    ...createClientActionTools({
      prisma: deps.prisma,
    }),
  ]);
}
