import type { CategoryDto } from '@data/catalog/dto';

import { mapCategory } from './categoryMapper';

const fixture: CategoryDto = {
  id: 'cat-electronics',
  parentId: null,
  slug: 'electronics',
  name: 'Electronics',
  imageUrl: '/api/v1/mock-assets/category-1.png',
  children: [
    {
      id: 'cat-audio',
      parentId: 'cat-electronics',
      slug: 'audio',
      name: 'Audio',
      imageUrl: '/api/v1/mock-assets/category-5.png',
      children: [],
    },
  ],
};

describe('category mapper', () => {
  it('maps a captured mock DTO recursively into immutable domain names', () => {
    expect(mapCategory(fixture)).toEqual({
      id: 'cat-electronics',
      title: 'Electronics',
      slug: 'electronics',
      imageUrl: '/api/v1/mock-assets/category-1.png',
      children: [
        {
          id: 'cat-audio',
          title: 'Audio',
          slug: 'audio',
          imageUrl: '/api/v1/mock-assets/category-5.png',
          children: [],
        },
      ],
    });
  });
});
