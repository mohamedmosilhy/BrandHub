import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import type { AppError } from '@core/errors';

import {
  cartItemCount,
  Quantity,
  type AddToCartUseCase,
  type Cart,
  type CartLine,
  type CartRepository,
  type RemoveCartLineUseCase,
  type UpdateCartLineUseCase,
} from '@domain/cart';
import type { Product, ProductVariant } from '@domain/catalog';
import type { ApplyCouponUseCase, Coupon } from '@domain/checkout';

const cartKey = ['cart'] as const;

async function valueOf<T>(
  operation: Promise<import('@core/result').Result<T, AppError>>,
): Promise<T> {
  const result = await operation;
  if (!result.ok) throw result.error;
  return result.value;
}

export type CartView = Readonly<{
  cart: Cart | null;
  count: number;
  coupon: Coupon | null;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  add: (product: Product, variant: ProductVariant) => Promise<AppError | null>;
  update: (line: CartLine, quantity: number) => Promise<AppError | null>;
  remove: (line: CartLine) => Promise<AppError | null>;
  applyCoupon: (code: string) => Promise<AppError | null>;
  clearCoupon: () => void;
  markOrdered: () => void;
}>;

export function useCart({
  repository,
  addToCart,
  updateCartLine,
  removeCartLine,
  applyCoupon,
  sessionKey,
}: {
  repository: CartRepository;
  addToCart: AddToCartUseCase;
  updateCartLine: UpdateCartLineUseCase;
  removeCartLine: RemoveCartLineUseCase;
  applyCoupon: ApplyCouponUseCase;
  sessionKey: string;
}): CartView {
  const client = useQueryClient();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const query = useQuery({
    queryKey: cartKey,
    queryFn: () => valueOf(repository.get()),
  });

  useEffect(() => {
    void client.invalidateQueries({ queryKey: cartKey });
  }, [client, sessionKey]);

  const addMutation = useMutation({
    mutationFn: ({
      product,
      variant,
    }: {
      product: Product;
      variant: ProductVariant;
    }) => valueOf(addToCart.execute(product, variant)),
    onSuccess: (cart) => client.setQueryData(cartKey, cart),
  });

  const updateMutation = useMutation({
    mutationFn: ({ line, quantity }: { line: CartLine; quantity: number }) =>
      valueOf(updateCartLine.execute(line, quantity)),
    onMutate: async ({ line, quantity }) => {
      await client.cancelQueries({ queryKey: cartKey });
      const previous = client.getQueryData<Cart>(cartKey);
      if (previous) {
        client.setQueryData<Cart>(cartKey, {
          ...previous,
          lines:
            quantity <= 0
              ? previous.lines.filter((item) => item.id !== line.id)
              : previous.lines.map((item) =>
                  item.id === line.id
                    ? {
                        ...item,
                        quantity: Quantity.create(quantity),
                        lineTotal: item.unitPrice.times(quantity),
                      }
                    : item,
                ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) client.setQueryData(cartKey, context.previous);
    },
    onSuccess: (cart) => client.setQueryData(cartKey, cart),
    onSettled: () => void client.invalidateQueries({ queryKey: cartKey }),
  });

  const removeMutation = useMutation({
    mutationFn: (line: CartLine) => valueOf(removeCartLine.execute(line.id)),
    onMutate: async (line) => {
      await client.cancelQueries({ queryKey: cartKey });
      const previous = client.getQueryData<Cart>(cartKey);
      if (previous) {
        client.setQueryData<Cart>(cartKey, {
          ...previous,
          lines: previous.lines.filter((item) => item.id !== line.id),
        });
      }
      return { previous };
    },
    onError: (_error, _line, context) => {
      if (context?.previous) client.setQueryData(cartKey, context.previous);
    },
    onSuccess: (cart) => client.setQueryData(cartKey, cart),
    onSettled: () => void client.invalidateQueries({ queryKey: cartKey }),
  });

  const cart = query.data ?? null;
  const run = useCallback(async (operation: Promise<unknown>) => {
    try {
      await operation;
      return null;
    } catch (error) {
      return error as AppError;
    }
  }, []);

  return {
    cart,
    count: cart ? cartItemCount(cart) : 0,
    coupon,
    isPending: query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
    add: (product, variant) =>
      run(addMutation.mutateAsync({ product, variant })),
    update: (line, quantity) =>
      run(updateMutation.mutateAsync({ line, quantity })),
    remove: (line) => run(removeMutation.mutateAsync(line)),
    applyCoupon: async (code) => {
      if (!cart) return null;
      const result = await applyCoupon.execute(code, cart);
      if (!result.ok) return result.error;
      setCoupon(result.value);
      return null;
    },
    clearCoupon: () => setCoupon(null),
    markOrdered: () => {
      if (cart) client.setQueryData<Cart>(cartKey, { ...cart, lines: [] });
      setCoupon(null);
    },
  };
}
