import { Component, inject } from '@angular/core';
import { WishlistService } from '../../core/services/wishlist-service/wishlist.service';
import { ProductsCardComponent } from '../../shared/components/products-card/products-card.component';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../core/services/products-service/products.service';

@Component({
  selector: 'app-wishlist',
  imports: [ProductsCardComponent, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css',
})
export class WishlistComponent {
  private readonly wishlistService = inject(WishlistService);
  private readonly productsService = inject(ProductsService);

  /**
   * State
   */
  readonly wishlistItems = this.wishlistService.items;
  readonly wishlistCount = this.wishlistService.wishlistCount;
  readonly isLoading = this.productsService.loading;
}
