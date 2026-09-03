import { z } from 'zod';

export type CategoryDto = Readonly<{
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  imageUrl: string;
  children: readonly CategoryDto[];
}>;

export const categoryDtoSchema: z.ZodType<CategoryDto> = z.lazy(() =>
  z.strictObject({
    id: z.string().min(1),
    parentId: z.string().nullable(),
    slug: z.string().min(1),
    name: z.string().min(1),
    imageUrl: z.string().min(1),
    children: z.array(categoryDtoSchema).default([]),
  }),
);

export const categoryTreeDtoSchema = z.array(categoryDtoSchema);
