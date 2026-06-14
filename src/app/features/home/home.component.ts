import { Component, computed, inject } from '@angular/core';
import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart-service/cart.service';
import { ProductsService } from '../../core/services/products-service/products.service';
import { ProductsCardComponent } from '../../shared/components/products-card/products-card.component';
import { RouterLink } from '@angular/router';
import { HeroComponent } from './components/hero/hero.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ProductsCardComponent, RouterLink, HeroComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  /**
   * INJECTION: Leveraging 'inject' for cleaner dependency management.
   */
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);

  /**
   * Loading state
   */
  readonly isLoading = this.productsService.loading;

  /**
   * REACTIVE DATA:
   * We consume the 'products' signal directly from the service.
   * This ensures the Home view automatically refreshes if the global product state changes.
   */
  readonly allProducts = this.productsService.products;

  /**
   * DERIVED STATE:
   * We only want to show a subset of products on the homepage.
   * 'computed' ensures this slice is re-calculated efficiently only when 'allProducts' changes.
   */
  readonly featuredProducts = computed(() => this.allProducts().slice(0, 8));

  /**
   * get the category list from the products service
   */
  readonly categories = this.productsService.categories;

  // Asset path reference
  readonly heroImage = '/images/AwaniLogo.jpeg';

  /**
   * Interaction handler: Proxies the call to the CartService.
   */
  addToCart(product: Product) {
    this.cartService.addToCart(product);
  }
}
