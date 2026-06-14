import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart-service/cart.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent {
  /**
   * SERVICE INJECTION:
   * Centralized access to cart logic and state.
   */
  readonly cartService = inject(CartService);

  /**
   * Business Rule: Static shipping fee for the demo.
   * In a production app, this might be a computed signal based on the subtotal or location.
   */
  shippingFee = 100;

  /**
   * STATE EXPOSURE:
   * We alias the signals from the service for shorter access in the template.
   */
  isCartOpen = this.cartService.isCartOpen;
  cartItems = this.cartService.items;
  cartTotal = this.cartService.cartTotal;

  /**
   * UI ACTION: Close the drawer.
   */
  closeCart() {
    this.cartService.isCartOpen.set(false);
  }

  /**
   * DATA ACTION: Proxy to the service for quantity management.
   */
  updateQty(id: number, qty: number) {
    this.cartService.updateQuantity(id, qty);
  }

  /**
   * DATA ACTION: Proxy to the service for item removal.
   */
  removeItem(id: number) {
    this.cartService.removeFromCart(id);
  }
}
