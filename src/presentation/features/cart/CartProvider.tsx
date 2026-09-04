import { createContext, useContext, type ReactNode } from 'react';

import type {
  AddToCartUseCase,
  CartRepository,
  RemoveCartLineUseCase,
  UpdateCartLineUseCase,
} from '@domain/cart';
import type { ApplyCouponUseCase } from '@domain/checkout';

import { useCart, type CartView } from './useCart';

const CartContext = createContext<CartView | null>(null);

export function CartProvider({
  children,
  repository,
  addToCart,
  updateCartLine,
  removeCartLine,
  applyCoupon,
  sessionKey,
}: {
  children: ReactNode;
  repository: CartRepository;
  addToCart: AddToCartUseCase;
  updateCartLine: UpdateCartLineUseCase;
  removeCartLine: RemoveCartLineUseCase;
  applyCoupon: ApplyCouponUseCase;
  sessionKey: string;
}) {
  const value = useCart({
    repository,
    addToCart,
    updateCartLine,
    removeCartLine,
    applyCoupon,
    sessionKey,
  });
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext(): CartView {
  const value = useContext(CartContext);
  if (!value)
    throw new Error('useCartContext must be used inside CartProvider.');
  return value;
}
