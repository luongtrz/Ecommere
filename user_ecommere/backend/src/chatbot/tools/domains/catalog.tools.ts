import { z } from 'zod';
import { AgentToolDef } from '../tool.types';
import { ProductSortBy } from '../../../products/dtos/product-filter.dto';
import type { ProductsService } from '../../../products/products.service';
import type { CategoriesService } from '../../../categories/categories.service';
import type { ChatbotRetrievalService } from '../../chatbot-retrieval.service';

export interface CatalogToolDeps {
  products: ProductsService;
  categories: CategoriesService;
  retrieval: ChatbotRetrievalService;
}

function projectProduct(product: any): any {
  if (!product || typeof product !== 'object') {
    return product;
  }

  const variants = Array.isArray(product.variants)
    ? product.variants.slice(0, 3).map((v: any) => ({
        id: v?.id,
        scent: v?.scent,
        volumeMl: v?.volumeMl,
        price: v?.price,
        salePrice: v?.salePrice,
        stock: v?.stock,
      }))
    : [];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    basePrice: product.basePrice,
    variants,
  };
}

function projectCategoryTree(categories: any, depth = 1): any {
  if (!Array.isArray(categories)) {
    return categories;
  }

  return categories.map((cat: any) => {
    const node: any = {
      id: cat?.id,
      name: cat?.name,
      slug: cat?.slug,
      productCount: cat?.productCount ?? 0,
    };

    if (depth < 2) {
      node.children = Array.isArray(cat?.children)
        ? projectCategoryTree(cat.children, depth + 1)
        : [];
    }

    return node;
  });
}

export function createCatalogTools(deps: CatalogToolDeps): AgentToolDef[] {
  const searchProductsTool: AgentToolDef = {
    name: 'search_products',
    domain: 'catalog',
    description:
      'Tìm sản phẩm theo từ khóa, danh mục, khoảng giá. Giá tính bằng VND. Luôn dùng công cụ này để biết tên, giá và tồn kho.',
    schema: z
      .object({
        query: z.string().max(120).optional(),
        categoryId: z.string().optional(),
        minPrice: z.number().int().min(0).optional(),
        maxPrice: z.number().int().min(0).optional(),
        sortBy: z.nativeEnum(ProductSortBy).optional(),
        page: z.number().int().min(1).max(50).optional(),
        limit: z.number().int().min(1).max(20).default(8),
      })
      .strict(),
    auth: 'public',
    risk: 'READ',
    handler: async (args) => {
      const { query, limit = 8, ...rest } = args;
      return deps.products.findAll({
        ...rest,
        limit,
        ...(query !== undefined ? { search: query } : {}),
      });
    },
    summarize: (args) =>
      args.query
        ? `Tìm kiếm sản phẩm "${args.query}"`
        : 'Tìm kiếm danh sách sản phẩm',
    project: (result: any) => {
      if (!result || typeof result !== 'object') {
        return result;
      }
      if (Array.isArray(result)) {
        return result.slice(0, 8).map(projectProduct);
      }
      if (Array.isArray(result.data)) {
        return {
          ...result,
          data: result.data.slice(0, 8).map(projectProduct),
        };
      }
      return result;
    },
  };

  const getProductTool: AgentToolDef = {
    name: 'get_product',
    domain: 'catalog',
    description:
      'Lấy thông tin chi tiết một sản phẩm theo slug (đường dẫn định danh). Trả về giá, thương hiệu và danh sách biến thể còn hàng.',
    schema: z
      .object({
        slug: z.string().min(1).max(200),
      })
      .strict(),
    auth: 'public',
    risk: 'READ',
    handler: async (args) => deps.products.findBySlug(args.slug),
    summarize: (args) => `Xem chi tiết sản phẩm "${args.slug}"`,
    project: (result: any) => projectProduct(result),
  };

  const getProductFiltersTool: AgentToolDef = {
    name: 'get_product_filters',
    domain: 'catalog',
    description:
      'Lấy danh sách các bộ lọc sản phẩm hiện có (thương hiệu, mùi hương, dung tích, khoảng giá). Dùng khi khách muốn biết shop có những lựa chọn nào.',
    schema: z.object({}).strict(),
    auth: 'public',
    risk: 'READ',
    handler: async () => deps.products.getFilterOptions(),
    summarize: () => 'Xem các bộ lọc tìm kiếm sản phẩm',
  };

  const listCategoriesTool: AgentToolDef = {
    name: 'list_categories',
    domain: 'catalog',
    description:
      'Xem danh mục sản phẩm theo cây phân cấp. Dùng khi khách muốn tìm hiểu các nhóm sản phẩm hoặc duyệt theo danh mục.',
    schema: z.object({}).strict(),
    auth: 'public',
    risk: 'READ',
    handler: async () => deps.categories.getTreeStructure(),
    summarize: () => 'Xem danh mục sản phẩm',
    project: (result: any) => projectCategoryTree(result),
  };

  const recommendProductsTool: AgentToolDef = {
    name: 'recommend_products',
    domain: 'catalog',
    description:
      'Gợi ý sản phẩm phù hợp với nhu cầu của khách (mùi hương, dịp dùng, ngân sách). Trả về danh sách nguồn sản phẩm để hiển thị thẻ.',
    schema: z
      .object({
        query: z.string().min(1).max(500),
      })
      .strict(),
    auth: 'public',
    risk: 'READ',
    handler: async (args) => {
      const result = await deps.retrieval.buildCatalogContext(args.query, {
        productLimit: 4,
        variantLimit: 3,
        candidateLimit: 12,
      });
      return {
        context: result?.context ?? '',
        sources: result?.sources ?? [],
      };
    },
    summarize: (args) => `Gợi ý sản phẩm cho nhu cầu "${args.query}"`,
  };

  return [
    searchProductsTool,
    getProductTool,
    getProductFiltersTool,
    listCategoriesTool,
    recommendProductsTool,
  ];
}
