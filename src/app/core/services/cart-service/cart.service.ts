import { computed, effect, inject, Injectable, PLATFORM_ID, Signal, signal, WritableSignal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CartItem, Product } from '../../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'awani_cart_items';

  /**
   * Internal WritableSignal for cart state management.
   * Using a Signal ensures that any changes to the cart automatically 
   * trigger updates in all dependent UI components and computed signals.
   */
  private readonly cartItems: WritableSignal<CartItem[]> = signal<CartItem[]>(this.loadFromStorage());
  
  /**
   * Controls the visibility of the global cart drawer.
   */
  readonly isCartOpen: WritableSignal<boolean> = signal<boolean>(false);

  /**
   * Public Readonly access to cart items.
   * Encapsulation: We expose a readonly signal to prevent direct external mutations,
   * forcing all updates through the service's methods.
   */
  readonly items = this.cartItems.asReadonly();

  /**
   * Derived state: Total monetary value of the cart.
   * Computed signals are lazily evaluated and memoized for optimal performance.
   */
  readonly cartTotal: Signal<number> = computed(() =>
    this.cartItems().reduce((total, item) => total + item.product.price * item.quantity, 0),
  );

  /**
   * Derived state: Total number of items in the cart.
   */
  readonly cartCount: Signal<number> = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0),
  );

  constructor() {
    /**
     * PERSISTENCE LAYER:
     * Using 'effect' to reactively sync the cart state to localStorage.
     * This decouples the business logic from the persistence logic.
     */
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cartItems()));
      }
    });
  }

  toggleCart(): void {
    this.isCartOpen.update((val) => !val);
  }

  /**
   * Add a product to the cart or increment its quantity if already present.
   */
  addToCart(product: Product): void {
    this.cartItems.update((items) => {
      const existingItem = items.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        return items.map((item) =>
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item,
        );
      }
      
      return [...items, { product, quantity: 1 }];
    });
    
    // Automatically open cart for better UX awareness
    this.isCartOpen.set(true);
  }

  /**
   * Completely remove a product from the cart regardless of quantity.
   */
  removeFromCart(productId: number): void {
    this.cartItems.update((items) => items.filter((item) => item.product.id !== productId));
  }

  /**
   * Update quantity for a specific product.
   * Handles deletion automatically if quantity drops to 0.
   */
  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    
    this.cartItems.update((items) =>
      items.map((item) => 
        item.product.id === productId ? { ...item, quantity } : item
      ),
    );
  }

  /**
   * Resets the cart to an empty state.
   */
  clearCart(): void {
    this.cartItems.set([]);
  }

  /**
   * HYDRATION LOGIC:
   * Safely loads the cart from localStorage on the client side.
   * Platform check is mandatory to prevent SSR (Server-Side Rendering) failures.
   */
  private loadFromStorage(): CartItem[] {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('Persistence Layer Error:', error);
        return [];
      }
    }
    return [];
  }
}
