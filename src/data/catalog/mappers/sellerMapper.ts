import type { Seller } from '@domain/catalog';

import type { SellerDto } from '@data/catalog/dto';

import type { AssetUrlResolver } from './productMapper';

export function mapSeller(
  dto: SellerDto,
  resolveUrl: AssetUrlResolver = (value) => value,
): Seller {
  return {
    id: dto.id,
    storeName: dto.storeName,
    verified: dto.verified,
    rating: dto.averageRating,
    salesCount: dto.salesCount,
    imageUrl: dto.profileImageUrl ? resolveUrl(dto.profileImageUrl) : null,
  };
}
