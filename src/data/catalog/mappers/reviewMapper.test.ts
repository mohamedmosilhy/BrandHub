import { mapReview, mapReviewPage } from './reviewMapper';
import { mapSeller } from './sellerMapper';

const reviewDto = {
  id: 'review-1',
  userId: 'user-customer',
  productId: 'product-1',
  userName: 'Salim Al Rashdi',
  rating: 4,
  comment: 'A useful product and prompt local delivery.',
  createdAt: '2026-09-02T12:00:00.000Z',
};

describe('reviewMapper', () => {
  it('carries the server-resolved reviewer name onto the entity', () => {
    expect(mapReview(reviewDto)).toEqual({
      id: 'review-1',
      productId: 'product-1',
      authorName: 'Salim Al Rashdi',
      rating: 4,
      comment: 'A useful product and prompt local delivery.',
      createdAt: '2026-09-02T12:00:00.000Z',
    });
  });

  it('maps a Spring page and reports whether another page follows', () => {
    const page = mapReviewPage({
      content: [reviewDto],
      totalElements: 12,
      totalPages: 2,
      number: 0,
      size: 10,
      first: true,
      last: false,
    });

    expect(page.items).toHaveLength(1);
    expect(page).toMatchObject({ page: 0, size: 10, total: 12, hasNext: true });
  });
});

describe('sellerMapper', () => {
  it('renames the contract fields and resolves the profile image', () => {
    expect(
      mapSeller(
        {
          id: 'seller-a2',
          storeName: 'A2 Official Store',
          verified: true,
          averageRating: 4.8,
          salesCount: 1940,
          profileImageUrl: '/api/v1/sellers/seller-a2/profile-image',
        },
        (value) => `https://api.test${value}`,
      ),
    ).toEqual({
      id: 'seller-a2',
      storeName: 'A2 Official Store',
      verified: true,
      rating: 4.8,
      salesCount: 1940,
      imageUrl: 'https://api.test/api/v1/sellers/seller-a2/profile-image',
    });
  });

  it('leaves the image null when the seller has none', () => {
    expect(
      mapSeller({
        id: 'seller-bait',
        storeName: 'Bait Oman',
        verified: false,
        averageRating: 4.6,
        salesCount: 920,
        profileImageUrl: null,
      }).imageUrl,
    ).toBeNull();
  });
});
