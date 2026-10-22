import { z } from 'zod';
import { AgentToolDef, ToolContext } from '../tool.types';
import { ToolError } from '../tool-result.util';
import type { ProductsService } from '../../../products/products.service';
import type { CategoriesService } from '../../../categories/categories.service';
import type {
  CreateProductDto,
  CreateVariantDto,
} from '../../../products/dtos/create-product.dto';
import type { CreateCategoryDto } from '../../../categories/dtos/create-category.dto';

export type AdminCatalogToolDeps = {
  products: ProductsService;
  categories: CategoriesService;
};

function projectListProductItem(product: any): any {
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
    active: product.active,
    basePrice: product.basePrice,
    variants,
  };
}

function projectProductList(result: any): any {
  if (!result || typeof result !== 'object') {
    return result;
  }
  if (Array.isArray(result)) {
    return result.slice(0, 20).map(projectListProductItem);
  }
  if (Array.isArray(result.data)) {
    return {
      ...result,
      data: result.data.slice(0, 20).map(projectListProductItem),
    };
  }
  return result;
}

function projectProductDetail(product: any): any {
  if (!product || typeof product !== 'object') {
    return product;
  }
  const variants = Array.isArray(product.variants)
    ? product.variants.slice(0, 20).map((v: any) => ({
        id: v?.id,
        scent: v?.scent,
        volumeMl: v?.volumeMl,
        price: v?.price,
        salePrice: v?.salePrice,
        stock: v?.stock,
        barcode: v?.barcode,
      }))
    : [];

  const description =
    typeof product.description === 'string'
      ? product.description.slice(0, 300)
      : product.description;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    active: product.active,
    basePrice: product.basePrice,
    description,
    variants,
  };
}

function projectCategoryTree(categories: any, depth = 1, maxDepth = 3): any {
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

    if (depth < maxDepth) {
      node.children = Array.isArray(cat?.children)
        ? projectCategoryTree(cat.children, depth + 1, maxDepth)
        : [];
    }

    return node;
  });
}

export function createAdminCatalogTools(
  deps: AdminCatalogToolDeps,
): AgentToolDef[] {
  // 1. list_products
  const listProductsSchema = z
    .object({
      search: z.string().min(1).max(100).optional(),
      categoryId: z.string().optional(),
      includeInactive: z.boolean().optional(),
      page: z.number().int().min(1).max(50).optional(),
      limit: z.number().int().min(1).max(50).optional(),
    })
    .strict();

  const listProductsTool: AgentToolDef = {
    name: 'list_products',
    domain: 'catalog',
    description:
      'Xem danh sách sản phẩm với bộ lọc tìm kiếm, danh mục, trạng thái ẩn/hiện và phân trang.',
    schema: listProductsSchema,
    auth: 'admin',
    risk: 'READ',
    handler: async (
      args: z.infer<typeof listProductsSchema>,
      _ctx: ToolContext,
    ) => {
      return deps.products.findAll(
        {
          search: args.search,
          categoryId: args.categoryId,
          page: args.page,
          limit: args.limit,
        },
        args.includeInactive === true,
      );
    },
    summarize: (args) =>
      args?.search
        ? `Tìm kiếm sản phẩm "${args.search}"`
        : 'Xem danh sách sản phẩm',
    project: (result: unknown) => projectProductList(result),
  };

  // 2. get_product
  const getProductSchema = z
    .object({
      id: z.string().min(1).max(64),
    })
    .strict();

  const getProductTool: AgentToolDef = {
    name: 'get_product',
    domain: 'catalog',
    description:
      'Xem thông tin chi tiết một sản phẩm theo ID (bao gồm cả sản phẩm đang ẩn).',
    schema: getProductSchema,
    auth: 'admin',
    risk: 'READ',
    handler: async (
      args: z.infer<typeof getProductSchema>,
      _ctx: ToolContext,
    ) => {
      return deps.products.findOne(args.id, true);
    },
    summarize: (args) => `Xem thông tin chi tiết sản phẩm ${args.id}`,
    project: (result: unknown) => projectProductDetail(result),
  };

  // 3. create_product
  const createProductVariantSchema = z
    .object({
      scent: z.string().min(1).max(100),
      volumeMl: z.number().int().min(1),
      price: z.number().int().min(0),
      salePrice: z.number().int().min(0).optional(),
      stock: z.number().int().min(0),
      barcode: z.string().min(1).max(64).optional(),
    })
    .strict();

  const createProductSchema = z
    .object({
      name: z.string().min(1).max(200),
      description: z.string().min(1).max(2000),
      brand: z.string().min(1).max(100).optional(),
      images: z.array(z.string().url()).max(10),
      categoryId: z.string().min(1).max(64),
      basePrice: z.number().int().min(0),
      active: z.boolean().optional(),
      variants: z.array(createProductVariantSchema).min(1).max(20),
    })
    .strict();

  const createProductTool: AgentToolDef = {
    name: 'create_product',
    domain: 'catalog',
    description:
      'Tạo sản phẩm mới kèm các biến thể. Giá tính bằng VND. Danh mục phải là danh mục lá.',
    schema: createProductSchema,
    auth: 'admin',
    risk: 'WRITE',
    handler: async (args: CreateProductDto, _ctx: ToolContext) => {
      return deps.products.create(args);
    },
    summarize: (args) => `Tạo sản phẩm mới "${args.name}"`,
  };

  // 4. update_product
  const updateProductSchema = z
    .object({
      id: z.string().min(1).max(64),
      name: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(2000).optional(),
      brand: z.string().min(1).max(100).optional(),
      images: z.array(z.string().url()).max(10).optional(),
      categoryId: z.string().min(1).max(64).optional(),
      basePrice: z.number().int().min(0).optional(),
      active: z.boolean().optional(),
    })
    .strict();

  const updateProductTool: AgentToolDef = {
    name: 'update_product',
    domain: 'catalog',
    description:
      'Cập nhật thông tin sản phẩm. Không cập nhật biến thể qua công cụ này. Cần ít nhất một trường ngoài id.',
    schema: updateProductSchema,
    auth: 'admin',
    risk: 'WRITE',
    handler: async (
      args: z.infer<typeof updateProductSchema>,
      _ctx: ToolContext,
    ) => {
      const { id, ...fields } = args;
      if (Object.keys(fields).length === 0) {
        throw new ToolError(
          'Cần ít nhất một trường để cập nhật sản phẩm ngoài id',
        );
      }
      return deps.products.update(id, fields);
    },
    summarize: (args) => `Cập nhật sản phẩm ${args.id}`,
  };

  // 5. create_variant
  const createVariantSchema = z
    .object({
      productId: z.string().min(1).max(64),
      scent: z.string().min(1).max(100),
      volumeMl: z.number().int().min(1),
      price: z.number().int().min(0),
      salePrice: z.number().int().min(0).optional(),
      stock: z.number().int().min(0),
      barcode: z.string().min(1).max(64).optional(),
    })
    .strict();

  const createVariantTool: AgentToolDef = {
    name: 'create_variant',
    domain: 'catalog',
    description: 'Tạo biến thể mới cho một sản phẩm đã có. Giá tính bằng VND.',
    schema: createVariantSchema,
    auth: 'admin',
    risk: 'WRITE',
    handler: async (
      args: CreateVariantDto & { productId: string },
      _ctx: ToolContext,
    ) => {
      const { productId, ...dto } = args;
      return deps.products.createVariant(productId, dto);
    },
    summarize: (args) => `Tạo biến thể mới cho sản phẩm ${args.productId}`,
  };

  // 6. update_variant
  const updateVariantSchema = z
    .object({
      variantId: z.string().min(1).max(64),
      scent: z.string().min(1).max(100).optional(),
      volumeMl: z.number().int().min(1).optional(),
      price: z.number().int().min(0).optional(),
      salePrice: z.number().int().min(0).nullable().optional(),
      barcode: z.string().min(1).max(64).optional(),
    })
    .strict();

  const updateVariantTool: AgentToolDef = {
    name: 'update_variant',
    domain: 'catalog',
    description:
      'Cập nhật thông tin một biến thể. Cần ít nhất một trường ngoài variantId.',
    schema: updateVariantSchema,
    auth: 'admin',
    risk: 'WRITE',
    handler: async (
      args: z.infer<typeof updateVariantSchema>,
      _ctx: ToolContext,
    ) => {
      const { variantId, ...fields } = args;
      if (Object.keys(fields).length === 0) {
        throw new ToolError(
          'Cần ít nhất một trường để cập nhật biến thể ngoài variantId',
        );
      }
      return deps.products.updateVariant(variantId, fields);
    },
    summarize: (args) => `Cập nhật biến thể ${args.variantId}`,
  };

  // 7. delete_product
  const deleteProductSchema = z
    .object({
      id: z.string().min(1).max(64),
    })
    .strict();

  const deleteProductTool: AgentToolDef = {
    name: 'delete_product',
    domain: 'catalog',
    description:
      'Xóa sản phẩm. Không hoàn tác được. Bị từ chối nếu sản phẩm đã có trong giỏ hàng, đơn hàng hoặc lịch sử kho.',
    schema: deleteProductSchema,
    auth: 'admin',
    risk: 'DESTRUCTIVE',
    handler: async (
      args: z.infer<typeof deleteProductSchema>,
      _ctx: ToolContext,
    ) => {
      return deps.products.remove(args.id);
    },
    summarize: (args) => `Xóa sản phẩm ${args.id}`,
  };

  // 8. delete_variant
  const deleteVariantSchema = z
    .object({
      variantId: z.string().min(1).max(64),
    })
    .strict();

  const deleteVariantTool: AgentToolDef = {
    name: 'delete_variant',
    domain: 'catalog',
    description:
      'Xóa biến thể sản phẩm. Không hoàn tác được. Không thể xóa biến thể cuối cùng của sản phẩm hoặc biến thể đã có lịch sử.',
    schema: deleteVariantSchema,
    auth: 'admin',
    risk: 'DESTRUCTIVE',
    handler: async (
      args: z.infer<typeof deleteVariantSchema>,
      _ctx: ToolContext,
    ) => {
      return deps.products.removeVariant(args.variantId);
    },
    summarize: (args) => `Xóa biến thể ${args.variantId}`,
  };

  // 9. list_categories
  const listCategoriesSchema = z.object({}).strict();

  const listCategoriesTool: AgentToolDef = {
    name: 'list_categories',
    domain: 'catalog',
    description: 'Xem cấu trúc danh mục theo dạng cây phân cấp.',
    schema: listCategoriesSchema,
    auth: 'admin',
    risk: 'READ',
    handler: async (_args: Record<string, never>, _ctx: ToolContext) => {
      return deps.categories.getTreeStructure();
    },
    summarize: () => 'Xem danh mục sản phẩm',
    project: (result: unknown) => projectCategoryTree(result),
  };

  // 10. create_category
  const createCategorySchema = z
    .object({
      name: z.string().min(1).max(100),
      parentId: z.string().min(1).max(64).optional(),
    })
    .strict();

  const createCategoryTool: AgentToolDef = {
    name: 'create_category',
    domain: 'catalog',
    description:
      'Tạo danh mục sản phẩm mới. Có thể chọn danh mục cha nếu là danh mục con.',
    schema: createCategorySchema,
    auth: 'admin',
    risk: 'WRITE',
    handler: async (args: CreateCategoryDto, _ctx: ToolContext) => {
      return deps.categories.create(args);
    },
    summarize: (args) => `Tạo danh mục "${args.name}"`,
  };

  // 11. update_category
  const updateCategorySchema = z
    .object({
      id: z.string().min(1).max(64),
      name: z.string().min(1).max(100).optional(),
      parentId: z.string().min(1).max(64).optional(),
    })
    .strict();

  const updateCategoryTool: AgentToolDef = {
    name: 'update_category',
    domain: 'catalog',
    description:
      'Cập nhật thông tin danh mục. Cần ít nhất một trong hai trường name hoặc parentId.',
    schema: updateCategorySchema,
    auth: 'admin',
    risk: 'WRITE',
    handler: async (
      args: z.infer<typeof updateCategorySchema>,
      _ctx: ToolContext,
    ) => {
      const { id, ...fields } = args;
      if (fields.name === undefined && fields.parentId === undefined) {
        throw new ToolError(
          'Cần ít nhất một trong hai trường name hoặc parentId để cập nhật danh mục',
        );
      }
      return deps.categories.update(id, fields);
    },
    summarize: (args) => `Cập nhật danh mục ${args.id}`,
  };

  // 12. delete_category
  const deleteCategorySchema = z
    .object({
      id: z.string().min(1).max(64),
    })
    .strict();

  const deleteCategoryTool: AgentToolDef = {
    name: 'delete_category',
    domain: 'catalog',
    description:
      'Xóa danh mục. Không hoàn tác được. Bị từ chối nếu danh mục có danh mục con hoặc có sản phẩm.',
    schema: deleteCategorySchema,
    auth: 'admin',
    risk: 'DESTRUCTIVE',
    handler: async (
      args: z.infer<typeof deleteCategorySchema>,
      _ctx: ToolContext,
    ) => {
      return deps.categories.remove(args.id);
    },
    summarize: (args) => `Xóa danh mục ${args.id}`,
  };

  return [
    listProductsTool,
    getProductTool,
    createProductTool,
    updateProductTool,
    createVariantTool,
    updateVariantTool,
    deleteProductTool,
    deleteVariantTool,
    listCategoriesTool,
    createCategoryTool,
    updateCategoryTool,
    deleteCategoryTool,
  ];
}
