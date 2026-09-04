import { z } from 'zod';

/**
 * `POST /users/me/addresses` and `PUT .../{id}` return the stored record. The API has no
 * `label` and no `areaId`; both are resolved in the mapper (D13, architecture.md §34.4).
 */
export const addressDtoSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().nullish(),
  city: z.string().min(1),
  state: z.string().nullish(),
  postalCode: z.string().nullish(),
  country: z.string().default('OM'),
  isDefault: z.boolean(),
});

export const addressListDtoSchema = z.array(addressDtoSchema);

export type AddressDto = z.infer<typeof addressDtoSchema>;
