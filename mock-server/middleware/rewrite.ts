export const routeRewrites: Record<string, string> = {
  '/api/v1/products/category/:categoryId':
    '/api/v1/products?categoryId=:categoryId',
  '/api/v1/reviews/product/:productId': '/api/v1/reviews?productId=:productId',
};
