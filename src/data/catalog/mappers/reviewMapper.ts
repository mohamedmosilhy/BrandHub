import { rating, type Page, type Review } from '@domain/catalog';

import type { ReviewDto, ReviewPageDto } from '@data/catalog/dto';

export function mapReview(dto: ReviewDto): Review {
  return {
    id: dto.id,
    productId: dto.productId,
    authorName: dto.userName,
    rating: rating(dto.rating),
    comment: dto.comment,
    createdAt: dto.createdAt,
  };
}

export function mapReviewPage(dto: ReviewPageDto): Page<Review> {
  return {
    items: dto.content.map(mapReview),
    page: dto.number,
    size: dto.size,
    total: dto.totalElements,
    hasNext: !dto.last,
  };
}
