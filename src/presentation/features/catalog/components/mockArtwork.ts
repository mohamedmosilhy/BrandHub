import type { ImageSource } from 'expo-image';

const productArtwork = [
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p1.jpg'),
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p2.jpg'),
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p3.jpg'),
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p4.jpg'),
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p5.jpg'),
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p6.jpg'),
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p7.jpg'),
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p8.jpg'),
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p9.jpg'),
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p10.jpg'),
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p11.jpg'),
  require('../../../../../design-reference/uploads/BRAND HUB (6)/assets/products/p12.jpg'),
] as const;

const categoryArtwork = [0, 2, 9, 8, 5, 4, 6, 7] as const;

function artworkIndex(value: string, prefix: string, fallbackKey: string) {
  const match = new RegExp(`${prefix}-(\\d+)`).exec(value);
  if (match?.[1]) return Number(match[1]) - 1;
  return [...fallbackKey].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function artworkAt(index: number): number {
  return productArtwork[index % productArtwork.length] ?? productArtwork[0];
}

/** Keep the mock catalogue visual even when a device cannot reach the local mock server. */
export function productArtworkSource(
  url: string | undefined,
  productId: string,
): ImageSource | number {
  if (!url) return artworkAt(artworkIndex('', 'product', productId));
  if (!url.includes('/mock-assets/')) return { uri: url };
  return artworkAt(artworkIndex(url, 'product', productId));
}

export function categoryArtworkSource(
  url: string,
  categoryId: string,
): ImageSource | number {
  if (!url.includes('/mock-assets/')) return { uri: url };
  const categoryIndex =
    artworkIndex(url, 'category', categoryId) % categoryArtwork.length;
  return artworkAt(categoryArtwork[categoryIndex] ?? 0);
}
