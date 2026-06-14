import {
  computed,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { Product } from '../../models/product.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'awani_wishlist_items';

  /**
   * Internal WritableSignal holding the array of liked products.
   */
  private readonly wishlistItems: WritableSignal<Product[]> = signal<Product[]>(
    this.loadFromStorage(),
  );

  /**
   * Public Readonly access to wishlist items for robust encapsulation.
   */
  readonly items = this.wishlistItems.asReadonly();

  /**
   * Derived state: Total count of items in the wishlist.
   */
  readonly wishlistCount: Signal<number> = computed(() => this.wishlistItems().length);

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.wishlistItems()));
      }
    });
  }

  /**
   * Core Toggle Logic:
   * Acts as an intelligent switch. Adds product if absent, removes it if already liked.
   */
  toggleWishlist(product: Product): void {
    this.wishlistItems.update((items) => {
      const exists = items.some((item) => item.id === product.id);

      if (exists) {
        // If it exists, filter it out (Remove action)
        return items.filter((item) => item.id !== product.id);
      }
      // If it doesn't exist, append it elegantly (Add action)
      return [...items, product];
    });
  }

  /**
   * High-performance checking utility.
   * Returns whether a specific product ID is inside the wishlist.
   */
  isInWishlist(productId: number): boolean {
    return this.wishlistItems().some((item) => item.id === productId);
  }

  /**
   * Hydration layer for safe cross-platform initialization.
   */
  private loadFromStorage(): Product[] {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('Wishlist Persistence Error:', error);
        return [];
      }
    }
    return [];
  }
}
