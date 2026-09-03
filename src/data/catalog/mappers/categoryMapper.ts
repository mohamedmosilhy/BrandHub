import type { Category } from '@domain/catalog';

import type { CategoryDto } from '@data/catalog/dto';

export function mapCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    title: dto.name,
    slug: dto.slug,
    imageUrl: dto.imageUrl,
    children: dto.children.map(mapCategory),
  };
}

export function mapCategoryTree(
  dtos: readonly CategoryDto[],
): readonly Category[] {
  return dtos.map(mapCategory);
}
