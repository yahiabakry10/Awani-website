import { Component, computed, inject, signal } from '@angular/core';
import { ProductsService } from '../../core/services/products-service/products.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart-service/cart.service';
import { CommonModule, CurrencyPipe, Location } from '@angular/common';
import { Product } from '../../core/models/product.model';
import { ProductsCardComponent } from '../../shared/components/products-card/products-card.component';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductsCardComponent, CurrencyPipe],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent {
  // Service DI
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);

  /**
   * Loading state
   */
  readonly isLoading = this.productsService.loading;

  /**
   * GLOBAL STATE:
   * Direct access to the centralized products signal.
   */
  readonly products = this.productsService.products;

  /**
   * UI LOCAL STATE:
   * Track which image is currently being viewed in the gallery.
   */
  readonly selectedImageIndex = signal<number>(0);

  /**
   * ROUTE REACTIVITY:
   * Converting paramMap to a signal to reactively track URL changes.
   */
  private readonly routeParams = toSignal(this.route.paramMap);

  /**
   * Extracted ID from the URL.
   */
  readonly productId = computed(() => this.routeParams()?.get('id'));

  /**
   * SELECTED PRODUCT STATE:
   * Derived from the ID and the global product list.
   * If the ID changes or the list is updated, this re-evaluates automatically.
   */
  readonly product = computed(() => {
    const id = this.productId();
    const productsList = this.products();
    if (!id || !productsList.length) return null;
    return productsList.find((p) => p.id === Number(id)) || null;
  });

  /**
   * GALLERY LOGIC:
   * Normalizes the gallery images. Falls back to the main product image
   * if no gallery is provided in the data.
   */
  readonly gallery = computed(() => {
    const p = this.product();
    if (!p) return [];
    return p.gallery && p.gallery.length > 0 ? p.gallery : [p.image];
  });

  /**
   * CROSS-SELLING LOGIC:
   * Recommends products from the same category, excluding the current product.
   * Limits results to 4 for a clean UI layout.
   */
  readonly relatedProducts = computed(() => {
    const p = this.product();
    const productsList = this.products();
    if (!p || !productsList.length) return [];
    return productsList
      .filter((prod) => prod.id !== p.id && prod.category === p.category)
      .slice(0, 4);
  });

  /**
   * UI Action: Gallery navigation.
   */
  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  /**
   * Navigation Action: Leverages the 'Location' service for breadcrumb-like behavior.
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Cart interaction proxy.
   */
  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }
}
