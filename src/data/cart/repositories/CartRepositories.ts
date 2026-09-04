import { isAppError } from '@core/errors';
import type { AppError } from '@core/errors';
import { err, ok, type Result } from '@core/result';

import type { AddCartItem, Cart, CartRepository } from '@domain/cart';

import type {
  CartRemoteDataSource,
  LocalCartDataSource,
} from '@data/cart/datasources';
import { mapCart } from '@data/cart/mappers';
import type { AssetUrlResolver } from '@data/catalog/mappers';

import { normalizeHttpError } from '@infrastructure/http';
import type { TokenStore } from '@infrastructure/storage';

type CartSource = CartRemoteDataSource | LocalCartDataSource;

export class CartRepositoryImpl implements CartRepository {
  constructor(
    private readonly source: CartSource,
    private readonly resolveUrl?: AssetUrlResolver,
  ) {}

  private failure(error: unknown) {
    return err(isAppError(error) ? error : normalizeHttpError(error));
  }

  async get() {
    try {
      return ok(mapCart(await this.source.get(), this.resolveUrl));
    } catch (error) {
      return this.failure(error);
    }
  }

  async add(input: AddCartItem) {
    try {
      return ok(mapCart(await this.source.add(input), this.resolveUrl));
    } catch (error) {
      return this.failure(error);
    }
  }

  async update(lineId: string, quantity: number) {
    try {
      return ok(
        mapCart(await this.source.update(lineId, quantity), this.resolveUrl),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async remove(lineId: string) {
    try {
      return ok(mapCart(await this.source.remove(lineId), this.resolveUrl));
    } catch (error) {
      return this.failure(error);
    }
  }

  async clear() {
    try {
      await this.source.clear();
      return ok(undefined);
    } catch (error) {
      return this.failure(error);
    }
  }
}

export class SessionAwareCartRepository implements CartRepository {
  private merge: Promise<Result<Cart, AppError>> | null = null;

  constructor(
    private readonly local: CartRepository,
    private readonly remote: CartRepository,
    private readonly tokens: TokenStore,
  ) {}

  private async authenticated(): Promise<boolean> {
    return Boolean(await this.tokens.getAccessToken());
  }

  private async remoteAfterMerge() {
    if (!this.merge) {
      this.merge = (async () => {
        const guest = await this.local.get();
        if (!guest.ok) return guest;
        for (const line of guest.value.lines) {
          const added = await this.remote.add({
            product: line.product,
            variant: line.variant,
            quantity: line.quantity.value,
          });
          if (!added.ok) return added;
          const removed = await this.local.remove(line.id);
          if (!removed.ok) return removed;
        }
        return this.remote.get();
      })().finally(() => {
        this.merge = null;
      });
    }
    return this.merge;
  }

  async get() {
    return (await this.authenticated())
      ? this.remoteAfterMerge()
      : this.local.get();
  }

  async add(input: AddCartItem) {
    return (await this.authenticated())
      ? this.remote.add(input)
      : this.local.add(input);
  }

  async update(lineId: string, quantity: number) {
    return (await this.authenticated())
      ? this.remote.update(lineId, quantity)
      : this.local.update(lineId, quantity);
  }

  async remove(lineId: string) {
    return (await this.authenticated())
      ? this.remote.remove(lineId)
      : this.local.remove(lineId);
  }

  async clear() {
    return (await this.authenticated())
      ? this.remote.clear()
      : this.local.clear();
  }
}
