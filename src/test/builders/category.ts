export const categoryTreeResponse = [
  {
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
  },
] as const;
