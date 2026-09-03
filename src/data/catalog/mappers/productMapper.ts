import { Money } from '@core/money';

import { rating, type Page, type Product } from '@domain/catalog';

import type { ProductDto, ProductPageDto } from '@data/catalog/dto';

export type AssetUrlResolver = (value: string) => string;
const identityUrl: AssetUrlResolver = (value) => value;

export function mapProduct(
  dto: ProductDto,
  resolveUrl: AssetUrlResolver = identityUrl,
): Product {
  const currentPrice = dto.salePrice ?? dto.basePrice;
  return {
    id: dto.id,
    slug: dto.slug,
    categoryId: dto.categoryId,
    sellerId: dto.sellerId,
    title: dto.name,
    description: dto.description,
    price: Money.fromDecimal(currentPrice),
    originalPrice:
      dto.salePrice !== null && dto.salePrice < dto.basePrice
        ? Money.fromDecimal(dto.basePrice)
        : null,
    stock: dto.stock,
    featured: dto.featured,
    createdAt: dto.createdAt,
    salesCount: dto.salesCount,
    rating: rating(dto.averageRating),
    reviewCount: dto.reviewCount,
    images: dto.images.map((image) => ({
      id: image.id,
      url: resolveUrl(image.url),
      alt: image.alt,
    })),
    variants: dto.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      attributes: variant.attributes,
      stock: variant.stock,
      price: Money.fromDecimal(variant.price),
    })),
    specs: dto.specs.map((spec) => ({ name: spec.name, value: spec.value })),
  };
}

export function mapProductPage(
  dto: ProductPageDto,
  resolveUrl: AssetUrlResolver = identityUrl,
): Page<Product> {
  return {
    items: dto.content.map((product) => mapProduct(product, resolveUrl)),
    page: dto.number,
    size: dto.size,
    total: dto.totalElements,
    hasNext: !dto.last,
  };
}
