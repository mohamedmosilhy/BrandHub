export type Seller = Readonly<{
  id: string;
  storeName: string;
  verified: boolean;
  rating: number;
  salesCount: number;
  imageUrl: string | null;
}>;
