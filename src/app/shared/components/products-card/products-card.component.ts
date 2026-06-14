import { Component, inject, input, signal, WritableSignal } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart-service/cart.service';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { WishlistService } from '../../../core/services/wishlist-service/wishlist.service';

@Component({
  selector: 'app-products-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './products-card.component.html',
  styleUrl: './products-card.component.css',
})
export class ProductsCardComponent {
  /**
   * INPUT: Using the new Signal-based 'input' API.
   * 'input.required' ensures that the component cannot be used without
   * passing a valid Product object, catching errors at compile-time.
   */
  product = input.required<Product>();

  private readonly cartService = inject(CartService);
  public readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);

  /**
   * Signal state to watch product card dissapear when removed from whishlist in wishlist page
   */
  isExiting: WritableSignal<boolean> = signal<boolean>(false);

  /**
   * UI ACTION: Add product to cart.
   * This logic is delegated to the central CartService to ensure
   * consistency across the entire application.
   */
  addToCart(product: Product) {
    this.cartService.addToCart(product);
  }

  toggleWishlist(product: Product): void {
    if (this.router.url.includes('wishlist')) {
      this.isExiting.set(true); // animation of card dissapearing starts immediately

      setTimeout(() => {
        this.wishlistService.toggleWishlist(product);
        this.isExiting.set(false); // after animation is done, the card is removed from DOM
      }, 300); // same time as animation duration
    } else {
      this.wishlistService.toggleWishlist(product);
    }
  }
}
