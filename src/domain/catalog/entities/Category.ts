export type Category = Readonly<{
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  children: readonly Category[];
}>;
