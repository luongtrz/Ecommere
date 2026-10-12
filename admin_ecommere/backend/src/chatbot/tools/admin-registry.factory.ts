import type { AdminService } from '../../admin/admin.service';
import type { ReportsService } from '../../admin/reports.service';
import type { CustomersService } from '../../admin/customers.service';
import type { OrdersService } from '../../orders/orders.service';
import type { ProductsService } from '../../products/products.service';
import type { CategoriesService } from '../../categories/categories.service';
import type { CouponsService } from '../../coupons/coupons.service';
import type { ReferralsService } from '../../referrals/referrals.service';
import type { ReviewsService } from '../../reviews/reviews.service';
import type { InventoryService } from '../../inventory/inventory.service';
import type { UploadsService } from '../../uploads/uploads.service';

import { ToolRegistry } from './tool.registry';
import { createReportsTools } from './domains/reports.tools';
import { createAdminOrdersTools } from './domains/orders.tools';
import { createAdminCatalogTools } from './domains/catalog.tools';
import { createCouponsReferralsTools } from './domains/coupons-referrals.tools';
import { createReviewsInventoryTools } from './domains/reviews-inventory.tools';

export interface AdminRegistryDeps {
  admin: AdminService;
  reports: ReportsService;
  customers: CustomersService;
  orders: OrdersService;
  products: ProductsService;
  categories: CategoriesService;
  coupons: CouponsService;
  referrals: ReferralsService;
  reviews: ReviewsService;
  inventory: InventoryService;
  uploads: UploadsService;
}

export function buildAdminToolRegistry(deps: AdminRegistryDeps): ToolRegistry {
  return new ToolRegistry([
    ...createReportsTools({
      admin: deps.admin,
      reports: deps.reports,
      customers: deps.customers,
    }),
    ...createAdminOrdersTools({
      orders: deps.orders,
    }),
    ...createAdminCatalogTools({
      products: deps.products,
      categories: deps.categories,
    }),
    ...createCouponsReferralsTools({
      coupons: deps.coupons,
      referrals: deps.referrals,
    }),
    ...createReviewsInventoryTools({
      reviews: deps.reviews,
      inventory: deps.inventory,
      uploads: deps.uploads,
    }),
  ]);
}
