import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface RetrievedSource {
  id: string;
  name: string;
  slug: string;
  score: number;
}

export interface RetrievalResult {
  hasResults: boolean;
  context: string;
  sources: RetrievedSource[];
}

@Injectable()
export class ChatbotRetrievalService {
  constructor(private readonly prisma: PrismaService) {}

  async buildCatalogContext(
    query: string,
    options: {
      productLimit: number;
      variantLimit: number;
      candidateLimit: number;
    },
  ): Promise<RetrievalResult> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return {
        hasResults: false,
        context: '',
        sources: [],
      };
    }
    const normalizedQuery = this.normalize(trimmedQuery);
    const tokens = this.extractTokens(trimmedQuery);
    const categoryIds = await this.findRelevantCategoryIds(trimmedQuery, tokens);

    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        OR: this.buildProductWhereClauses(trimmedQuery, tokens, categoryIds),
      },
      include: {
        category: true,
        variants: true,
      },
      take: options.candidateLimit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const rankedProducts = products
      .map((product) => ({
        product,
        score: this.scoreProduct(product, normalizedQuery, tokens, new Set(categoryIds)),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, options.productLimit);

    if (rankedProducts.length === 0) {
      return {
        hasResults: false,
        context: '',
        sources: [],
      };
    }

    const context = rankedProducts
      .map(({ product, score }, index) =>
        this.formatProductContext(index + 1, product, score, normalizedQuery, tokens, options.variantLimit),
      )
      .join('\n\n');

    return {
      hasResults: true,
      context,
      sources: rankedProducts.map(({ product, score }) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        score,
      })),
    };
  }

  private buildProductWhereClauses(query: string, tokens: string[], categoryIds: string[]) {
    const terms = Array.from(new Set([query, ...tokens])).filter(Boolean).slice(0, 8);
    const clauses: any[] = terms.flatMap((term) => [
      { name: { contains: term, mode: 'insensitive' as const } },
      { description: { contains: term, mode: 'insensitive' as const } },
      { brand: { contains: term, mode: 'insensitive' as const } },
      { slug: { contains: this.slugify(term), mode: 'insensitive' as const } },
      { category: { name: { contains: term, mode: 'insensitive' as const } } },
      { variants: { some: { scent: { contains: term, mode: 'insensitive' as const } } } },
      { variants: { some: { sku: { contains: term, mode: 'insensitive' as const } } } },
    ]);

    if (categoryIds.length > 0) {
      clauses.push({ categoryId: { in: categoryIds } });
    }

    return clauses.length > 0
      ? clauses
      : [{ name: { contains: query, mode: 'insensitive' as const } }];
  }

  private async findRelevantCategoryIds(query: string, tokens: string[]) {
    const terms = Array.from(new Set([query, ...tokens])).filter(Boolean).slice(0, 6);

    if (terms.length === 0) {
      return [];
    }

    const categories = await this.prisma.category.findMany({
      where: {
        OR: terms.flatMap((term) => [
          { name: { contains: term, mode: 'insensitive' as const } },
          { slug: { contains: this.slugify(term), mode: 'insensitive' as const } },
        ]),
      },
      select: { id: true },
      take: 6,
    });

    return categories.map((category) => category.id);
  }

  private scoreProduct(
    product: {
      name: string;
      description: string;
      brand: string | null;
      slug: string;
      category: { id: string; name: string; slug: string };
      variants: Array<{
        sku: string;
        scent: string;
        volumeMl: number;
        price: number;
        salePrice: number | null;
        stock: number;
      }>;
    },
    normalizedQuery: string,
    tokens: string[],
    matchedCategoryIds: Set<string>,
  ) {
    const name = this.normalize(product.name);
    const description = this.normalize(product.description);
    const brand = this.normalize(product.brand || '');
    const categoryName = this.normalize(product.category.name);
    const categorySlug = this.normalize(product.category.slug);
    const variantScentText = this.normalize(product.variants.map((variant) => variant.scent).join(' '));
    const variantSkuText = this.normalize(product.variants.map((variant) => variant.sku).join(' '));

    let score = 0;

    if (name.includes(normalizedQuery)) score += 120;
    if (variantScentText.includes(normalizedQuery)) score += 90;
    if (categoryName.includes(normalizedQuery) || categorySlug.includes(normalizedQuery)) score += 70;
    if (brand.includes(normalizedQuery)) score += 50;
    if (description.includes(normalizedQuery)) score += 30;
    if (variantSkuText.includes(normalizedQuery)) score += 20;
    if (matchedCategoryIds.has(product.category.id)) score += 25;

    for (const token of tokens) {
      if (name.includes(token)) score += 18;
      if (variantScentText.includes(token)) score += 16;
      if (categoryName.includes(token) || categorySlug.includes(token)) score += 12;
      if (brand.includes(token)) score += 10;
      if (description.includes(token)) score += 6;
      if (variantSkuText.includes(token)) score += 8;
    }

    if (product.variants.some((variant) => variant.stock > 0)) {
      score += 8;
    }

    return score;
  }

  private formatProductContext(
    index: number,
    product: {
      name: string;
      slug: string;
      description: string;
      brand: string | null;
      basePrice: number;
      category: { name: string };
      variants: Array<{
        sku: string;
        scent: string;
        volumeMl: number;
        price: number;
        salePrice: number | null;
        stock: number;
      }>;
    },
    score: number,
    normalizedQuery: string,
    tokens: string[],
    variantLimit: number,
  ) {
    const rankedVariants = product.variants
      .map((variant) => ({
        ...variant,
        score: this.scoreVariant(variant, normalizedQuery, tokens),
      }))
      .sort((left, right) => right.score - left.score || right.stock - left.stock)
      .slice(0, variantLimit);

    const prices = product.variants.map((variant) => variant.salePrice || variant.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : product.basePrice;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : product.basePrice;
    const shortDescription = product.description.length > 180
      ? `${product.description.slice(0, 177)}...`
      : product.description;

    const variantLines = rankedVariants.length > 0
      ? rankedVariants.map((variant) => {
          const actualPrice = variant.salePrice || variant.price;
          return `  * ${variant.scent} | ${variant.volumeMl}ml | ${this.formatMoney(actualPrice)} | ${variant.stock > 0 ? `còn ${variant.stock}` : 'hết hàng'} | SKU ${variant.sku}`;
        }).join('\n')
      : '  * Chưa có biến thể phù hợp được truy xuất';

    return [
      `${index}. ${product.name} (score ${score})`,
      `- Slug: ${product.slug}`,
      `- Danh mục: ${product.category.name}`,
      product.brand ? `- Thương hiệu: ${product.brand}` : null,
      `- Mô tả: ${shortDescription}`,
      `- Giá tham khảo: ${this.formatPriceRange(minPrice, maxPrice)}`,
      `- Biến thể nổi bật:`,
      variantLines,
    ].filter(Boolean).join('\n');
  }

  private scoreVariant(
    variant: {
      scent: string;
      sku: string;
      volumeMl: number;
      stock: number;
    },
    normalizedQuery: string,
    tokens: string[],
  ) {
    const scent = this.normalize(variant.scent);
    const sku = this.normalize(variant.sku);
    const volume = String(variant.volumeMl);

    let score = 0;

    if (scent.includes(normalizedQuery)) score += 60;
    if (sku.includes(normalizedQuery)) score += 20;
    if (normalizedQuery.includes(volume)) score += 12;

    for (const token of tokens) {
      if (scent.includes(token)) score += 12;
      if (sku.includes(token)) score += 8;
      if (volume === token) score += 10;
    }

    if (variant.stock > 0) {
      score += 4;
    }

    return score;
  }

  private extractTokens(value: string) {
    return Array.from(
      new Set(
        this.normalize(value)
          .split(/[^a-z0-9]+/)
          .map((token) => token.trim())
          .filter((token) => token.length >= 2),
      ),
    ).slice(0, 10);
  }

  private normalize(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private slugify(value: string) {
    return this.normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private formatMoney(value: number) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatPriceRange(minPrice: number, maxPrice: number) {
    if (minPrice === maxPrice) {
      return this.formatMoney(minPrice);
    }

    return `${this.formatMoney(minPrice)} - ${this.formatMoney(maxPrice)}`;
  }
}
